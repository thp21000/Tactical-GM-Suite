import { useEffect, useRef, useState } from "react";
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

export function useStatTokenOverlayAutoSync({
  enabled,
  tokens,
}: {
  enabled: boolean;
  tokens: StatTrackedToken[];
}) {
  const previousTokensRef = useRef<Map<string, StatTrackedToken>>(new Map());
  const pendingUpdatesRef = useRef<Map<string, StatTrackedToken>>(new Map());
  const pendingDeletesRef = useRef<Map<string, StatTrackedToken>>(new Map());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const rerunRef = useRef(false);
  const enabledRef = useRef(enabled);
  const [state, setState] = useState<AutoSyncState>({ isSyncing: false });

  enabledRef.current = enabled;

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
      pendingUpdatesRef.current.size === 0 &&
      pendingDeletesRef.current.size === 0
    ) {
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void flushPending();
    }, AUTO_SYNC_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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
