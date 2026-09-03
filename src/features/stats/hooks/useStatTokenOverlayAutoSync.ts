import { useEffect, useRef, useState } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
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

function getTrackerOverlaySignature(token: StatTrackedToken): string {
  return JSON.stringify(
    token.trackers.map((tracker) => ({
      id: tracker.id,
      name: tracker.name,
      visualType: tracker.visualType,
      iconId: tracker.iconId,
      current: tracker.current,
      max: tracker.max,
      value: tracker.value,
      enabled: tracker.enabled,
      visibility: tracker.visibility,
      showOnToken: tracker.showOnToken,
      updatedAt: tracker.updatedAt,
    })),
  );
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

/**
 * Auto-sync for the Stats text/value overlay only.
 *
 * Conditions deliberately do not participate here. A condition metadata write
 * must never recreate or update the Stats overlay; Conditions own their own
 * background/menu synchronization path.
 */
export function useStatTokenOverlayAutoSync({
  enabled,
  tokens,
}: {
  enabled: boolean;
  tokens: StatTrackedToken[];
}) {
  const previousTokensRef = useRef<Map<string, StatTrackedToken>>(new Map());
  const previousTrackerSignaturesRef = useRef<Map<string, string>>(new Map());
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
          const result = await deleteTokenOverlay(token);
          if (result.status === "error") {
            setState({ isSyncing: true, lastError: result.message });
          }
        }

        for (const token of updates) {
          if (!enabledRef.current || !token.sourceItemId) continue;
          const result = await createOrUpdateTokenOverlay(token);
          if (result.status === "error") {
            setState({ isSyncing: true, lastError: result.message });
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

  // Only tracker-relevant changes trigger the Stats overlay. Condition-only
  // writes still update the embedded profile but leave this overlay untouched.
  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const previousTokens = previousTokensRef.current;
    const previousSignatures = previousTrackerSignaturesRef.current;
    const nextTokens = toTokenMap(tokens);
    const nextSignatures = new Map<string, string>();

    for (const token of tokens) {
      const key = getTokenInstanceKey(token);
      const signature = getTrackerOverlaySignature(token);
      nextSignatures.set(key, signature);

      if (!previousTokens.has(key) || previousSignatures.get(key) !== signature) {
        pendingUpdatesRef.current.set(key, token);
      }
    }

    for (const [key, oldToken] of previousTokens) {
      if (!nextTokens.has(key) && oldToken.sourceItemId) {
        pendingDeletesRef.current.set(key, oldToken);
      }
    }

    previousTokensRef.current = nextTokens;
    previousTrackerSignaturesRef.current = nextSignatures;

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

  // Geometry changes keep the Stats overlay aligned with the source token.
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
