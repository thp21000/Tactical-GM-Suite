import { useEffect, useRef, useState } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import {
  createOrUpdateTokenConditionOverlay,
  deleteTokenConditionOverlay,
} from "../services/statConditionOverlayObrSync";
import {
  createOrUpdateTokenOverlay,
  deleteTokenOverlay,
} from "../services/statTokenOverlayObrSync";

const AUTO_SYNC_DEBOUNCE_MS = 300;
const GEOMETRY_SYNC_DEBOUNCE_MS = 80;

type AutoSyncState = {
  isSyncing: boolean;
  lastError?: string;
};

function getTokenInstanceKey(token: StatTrackedToken): string {
  return `${token.id}:${token.sourceItemId ?? "manual"}`;
}

function toTokenMap(tokens: StatTrackedToken[]): Map<string, StatTrackedToken> {
  return new Map(tokens.map((token) => [getTokenInstanceKey(token), token]));
}

function getItemGeometrySignature(item: Item): string {
  return [
    item.position.x,
    item.position.y,
    item.scale.x,
    item.scale.y,
    item.rotation,
    item.visible ? 1 : 0,
  ].join(":");
}

export function useStatTokenOverlayAutoSync({
  enabled,
  tokens,
}: {
  enabled: boolean;
  tokens: StatTrackedToken[];
}) {
  const previousTokensRef = useRef<Map<string, StatTrackedToken>>(new Map());
  const sourceGeometryRef = useRef<Map<string, string>>(new Map());
  const pendingUpdatesRef = useRef<Map<string, StatTrackedToken>>(new Map());
  const pendingDeletesRef = useRef<Map<string, StatTrackedToken>>(new Map());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const rerunRef = useRef(false);
  const enabledRef = useRef(enabled);
  const [state, setState] = useState<AutoSyncState>({ isSyncing: false });

  enabledRef.current = enabled;

  function scheduleFlush(delay: number) {
    if (!enabledRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void flushPending();
    }, delay);
  }

  async function flushPending() {
    if (!enabledRef.current) return;

    if (runningRef.current) {
      rerunRef.current = true;
      return;
    }

    runningRef.current = true;
    setState((current) => ({ ...current, isSyncing: true, lastError: undefined }));

    try {
      do {
        rerunRef.current = false;

        const deletes = [...pendingDeletesRef.current.values()];
        const updates = [...pendingUpdatesRef.current.values()];
        pendingDeletesRef.current.clear();
        pendingUpdatesRef.current.clear();

        for (const token of deletes) {
          if (!enabledRef.current) break;

          const trackerResult = await deleteTokenOverlay(token);
          const conditionResult = await deleteTokenConditionOverlay(token);
          const errorResult = [trackerResult, conditionResult].find(
            (result) => result.status === "error",
          );
          if (errorResult) {
            setState({ isSyncing: true, lastError: errorResult.message });
          }
        }

        for (const token of updates) {
          if (!enabledRef.current || !token.sourceItemId) continue;

          const trackerResult = await createOrUpdateTokenOverlay(token);
          const conditionResult = await createOrUpdateTokenConditionOverlay(token);
          const errorResult = [trackerResult, conditionResult].find(
            (result) => result.status === "error",
          );
          if (errorResult) {
            setState({ isSyncing: true, lastError: errorResult.message });
          }
        }

        if (
          pendingDeletesRef.current.size > 0 ||
          pendingUpdatesRef.current.size > 0
        ) {
          rerunRef.current = true;
        }
      } while (enabledRef.current && rerunRef.current);
    } finally {
      runningRef.current = false;
      setState((current) => ({ ...current, isSyncing: false }));
    }
  }

  // Stats data changes: conditions, trackers, values, visibility, showOnToken, etc.
  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const previous = previousTokensRef.current;
    const next = toTokenMap(tokens);

    for (const token of tokens) {
      const key = getTokenInstanceKey(token);
      const oldToken = previous.get(key);

      if (!oldToken || oldToken.updatedAt !== token.updatedAt) {
        pendingUpdatesRef.current.set(key, token);
      }
    }

    for (const [key, oldToken] of previous) {
      if (!next.has(key) && oldToken.sourceItemId) {
        pendingDeletesRef.current.set(key, oldToken);
      }
    }

    previousTokensRef.current = next;

    if (
      pendingUpdatesRef.current.size > 0 ||
      pendingDeletesRef.current.size > 0
    ) {
      scheduleFlush(AUTO_SYNC_DEBOUNCE_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, tokens]);

  // Owlbear geometry changes: keep the condition ring aligned when a token is
  // moved or resized. POSITION attachment remains instant; this explicit sync
  // recalculates the ring diameter after SCALE changes without double-scaling.
  useEffect(() => {
    if (!enabled || !OBR.isAvailable) return;

    let disposed = false;
    const tokenBySourceId = new Map<string, StatTrackedToken>();
    for (const token of tokens) {
      if (token.sourceItemId) tokenBySourceId.set(token.sourceItemId, token);
    }
    if (tokenBySourceId.size === 0) return;

    const inspectItems = (items: Item[]) => {
      if (disposed) return;

      let needsSync = false;
      const itemById = new Map(items.map((item) => [item.id, item]));

      for (const [sourceItemId, token] of tokenBySourceId) {
        const item = itemById.get(sourceItemId);
        if (!item) continue;

        const signature = getItemGeometrySignature(item);
        const previous = sourceGeometryRef.current.get(sourceItemId);
        sourceGeometryRef.current.set(sourceItemId, signature);

        if (previous !== undefined && previous !== signature) {
          pendingUpdatesRef.current.set(getTokenInstanceKey(token), token);
          needsSync = true;
        }
      }

      if (needsSync) scheduleFlush(GEOMETRY_SYNC_DEBOUNCE_MS);
    };

    void OBR.scene.items
      .getItems([...tokenBySourceId.keys()])
      .then(inspectItems)
      .catch(() => undefined);

    const unsubscribe = OBR.scene.items.onChange(inspectItems);
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [enabled, tokens]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      enabledRef.current = false;
    },
    [],
  );

  return state;
}
