import { useEffect, useRef, useState } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import {
  createOrUpdateTokenOverlay,
  deleteTokenOverlay,
} from "../services/statTokenOverlayObrSync";
import { subscribeToStatRoomSettings } from "../services/statRoomSettings";

const AUTO_SYNC_DEBOUNCE_MS = 300;
const GEOMETRY_SYNC_DEBOUNCE_MS = 120;

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

/** Le déplacement est pris en charge nativement par l'attachement Owlbear. */
function getItemGeometrySignature(item: Item): string {
  return [item.scale.x, item.scale.y, item.visible ? 1 : 0].join(":");
}

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
  const tokensRef = useRef(tokens);
  const [state, setState] = useState<AutoSyncState>({ isSyncing: false });

  enabledRef.current = enabled;
  tokensRef.current = tokens;

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
          if (result.status === "error") setState({ isSyncing: true, lastError: result.message });
        }
        for (const token of updates) {
          if (!enabledRef.current || !token.sourceItemId) continue;
          const result = await createOrUpdateTokenOverlay(token);
          if (result.status === "error") setState({ isSyncing: true, lastError: result.message });
        }

        if (pendingDeletesRef.current.size > 0 || pendingUpdatesRef.current.size > 0) {
          rerunRef.current = true;
        }
      } while (enabledRef.current && rerunRef.current);
    } finally {
      runningRef.current = false;
      setState((current) => ({ ...current, isSyncing: false }));
    }
  }

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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
      if (!nextTokens.has(key) && oldToken.sourceItemId) pendingDeletesRef.current.set(key, oldToken);
    }

    previousTokensRef.current = nextTokens;
    previousTrackerSignaturesRef.current = nextSignatures;
    if (pendingUpdatesRef.current.size > 0 || pendingDeletesRef.current.size > 0) {
      scheduleFlush(AUTO_SYNC_DEBOUNCE_MS);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [enabled, tokens]);

  // Changer Haut/Bas doit repositionner immédiatement tous les docks ouverts.
  useEffect(() => {
    if (!enabled || !OBR.isAvailable) return;
    let first = true;
    return subscribeToStatRoomSettings(() => {
      if (first) {
        first = false;
        return;
      }
      for (const token of tokensRef.current) {
        if (token.sourceItemId) pendingUpdatesRef.current.set(getTokenInstanceKey(token), token);
      }
      scheduleFlush(AUTO_SYNC_DEBOUNCE_MS);
    });
  }, [enabled]);

  // Un resize du token change l'échelle du Stat Dock. Un simple déplacement ne
  // déclenche rien : les items attachés suivent déjà le token nativement.
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

    void OBR.scene.items.getItems([...tokenBySourceId.keys()]).then(inspectItems).catch(() => undefined);
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
