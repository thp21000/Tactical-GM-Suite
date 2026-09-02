import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type {
  StatTokenInput,
  StatTokenType,
  StatTrackedToken,
  StatTracker,
  StatTrackerInput,
  StatTrackerState,
} from "../statTypes";
import {
  addConditionToToken as appendConditionToToken,
  clearTokenConditionDuration as clearConditionDurationFromToken,
  decrementTokenConditionDuration as decrementDurationFromToken,
  removeConditionFromToken as deleteConditionFromToken,
  type StatTokenConditionInput,
  updateTokenCondition as patchConditionOnToken,
} from "../services/statConditions";
import {
  addTrackerToPreset,
  createTrackersFromPreset,
  getMissingPresetTrackerInputs,
  removeTrackerFromPreset as removeTrackerInputFromPreset,
  resetAllStatPresets,
  resetPresetForTokenType,
} from "../services/statPresets";
import {
  changeTrackerValue as changeValue,
  createTracker,
  setTrackerValue as setValue,
  toggleTracker as toggleValue,
  updateTracker as patchTracker,
} from "../services/statTrackers";
import {
  addTrackerToToken,
  createEmptyStatTrackerState,
  createTrackedToken,
  getDisplayGroups,
  removeTrackerFromToken,
  updateTokenTracker,
  updateTrackedToken,
} from "../services/statTokens";
import { getTokenDisplayItems } from "../services/statTokenDisplay";
import { getLinkedStatTokenId } from "../services/statTokenSceneLinks";
import {
  readStatTrackerState,
  resetStatTrackerState,
  subscribeToStatTrackerState,
  writeStatTrackerState,
} from "../services/statStorage";

function touch(state: StatTrackerState): StatTrackerState {
  return { ...state, updatedAt: new Date().toISOString() };
}

function now(): string {
  return new Date().toISOString();
}

function createPresetTrackers(
  tokenType: StatTokenInput["tokenType"],
  state: StatTrackerState,
): StatTracker[] {
  return createTrackersFromPreset(tokenType, state.presets).map(createTracker);
}

function createTokenWithPreset(
  input: StatTokenInput,
  state: StatTrackerState,
): StatTrackedToken {
  const token = createTrackedToken(input);

  return {
    ...token,
    trackers: createPresetTrackers(input.tokenType, state),
  };
}

function createTokenFromObrItemWithPreset(
  item: Item,
  state: StatTrackerState,
): StatTrackedToken {
  return createTokenWithPreset(
    {
      sourceItemId: item.id,
      name: item.name || "Token",
      tokenType: "enemy",
    },
    state,
  );
}

export function useStatTrackerState(isObrReady: boolean) {
  const [state, setState] = useState<StatTrackerState>(() =>
    createEmptyStatTrackerState(),
  );
  const hasLoaded = useRef(false);

  useEffect(() => {
    // In Owlbear, never fall back to local storage while the SDK is still
    // starting. Doing so could load an empty local state and write it back to
    // room metadata before the real room state has been read.
    if (OBR.isAvailable && !isObrReady) {
      hasLoaded.current = false;
      return undefined;
    }

    let mounted = true;
    hasLoaded.current = false;

    void readStatTrackerState()
      .then((next) => {
        if (!mounted) return;
        hasLoaded.current = true;
        setState(next);
      })
      .catch(() => {
        // Keep the current in-memory state and, importantly, do not enable
        // writes after a failed room read.
      });

    const unsubscribe = subscribeToStatTrackerState((next) => {
      if (!mounted) return;
      hasLoaded.current = true;
      setState(next);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isObrReady]);

  useEffect(() => {
    if (!hasLoaded.current) return;
    if (OBR.isAvailable && !isObrReady) return;
    void writeStatTrackerState(state);
  }, [isObrReady, state]);

  const tokens = state.tokens;
  const groups = state.groups;
  const presets = state.presets;

  const addToken = useCallback((input: StatTokenInput) => {
    setState((current) =>
      touch({
        ...current,
        tokens: [...current.tokens, createTokenWithPreset(input, current)],
      }),
    );
  }, []);

  const addItems = useCallback((items: Item[]) => {
    setState((current) => {
      const nextTokens = [...current.tokens];
      let changed = false;

      for (const item of items) {
        const linkedTokenId = getLinkedStatTokenId(item);
        const existingIndex = nextTokens.findIndex(
          (token) =>
            token.sourceItemId === item.id ||
            (linkedTokenId !== undefined && token.id === linkedTokenId),
        );

        if (existingIndex >= 0) {
          const existing = nextTokens[existingIndex];
          if (existing && existing.isTracked === false) {
            nextTokens[existingIndex] = {
              ...existing,
              isTracked: true,
              updatedAt: now(),
            };
            changed = true;
          }
          continue;
        }

        const created = createTokenFromObrItemWithPreset(item, current);
        // A copied Owlbear token inherits our canonical tokenId metadata. If
        // the room profile is missing, keep that ID so all copies reconnect to
        // the same canonical profile instead of fragmenting into new ones.
        if (linkedTokenId) created.id = linkedTokenId;
        nextTokens.push(created);
        changed = true;
      }

      return changed ? touch({ ...current, tokens: nextTokens }) : current;
    });
  }, []);

  const removeItems = useCallback((items: Item[]) => {
    setState((current) => {
      const sourceItemIds = new Set(items.map((item) => item.id));
      const linkedTokenIds = new Set(
        items
          .map(getLinkedStatTokenId)
          .filter((tokenId): tokenId is string => Boolean(tokenId)),
      );
      let changed = false;

      const nextTokens = current.tokens.map((token) => {
        const matches =
          linkedTokenIds.has(token.id) ||
          (token.sourceItemId !== undefined && sourceItemIds.has(token.sourceItemId));
        if (!matches || token.isTracked === false) return token;

        changed = true;
        return { ...token, isTracked: false, updatedAt: now() };
      });

      return changed ? touch({ ...current, tokens: nextTokens }) : current;
    });
  }, []);

  const updateToken = useCallback(
    (tokenId: string, patch: Partial<StatTokenInput>) => {
      setState((current) =>
        touch({
          ...current,
          tokens: current.tokens.map((token) =>
            token.id === tokenId ? updateTrackedToken(token, patch) : token,
          ),
        }),
      );
    },
    [],
  );

  const removeToken = useCallback((tokenId: string) => {
    setState((current) => {
      let changed = false;
      const nextTokens = current.tokens.map((token) => {
        if (token.id !== tokenId || token.isTracked === false) return token;
        changed = true;
        return { ...token, isTracked: false, updatedAt: now() };
      });

      return changed ? touch({ ...current, tokens: nextTokens }) : current;
    });
  }, []);

  const mapToken = useCallback(
    (tokenId: string, update: (token: StatTrackedToken) => StatTrackedToken) => {
      setState((current) =>
        touch({
          ...current,
          tokens: current.tokens.map((token) =>
            token.id === tokenId ? update(token) : token,
          ),
        }),
      );
    },
    [],
  );

  const addTracker = useCallback(
    (tokenId: string, input: StatTrackerInput) => {
      mapToken(tokenId, (token) => addTrackerToToken(token, createTracker(input)));
    },
    [mapToken],
  );

  const addConditionToToken = useCallback(
    (tokenId: string, conditionId: string, value?: number) => {
      mapToken(tokenId, (token) => appendConditionToToken(token, conditionId, value));
    },
    [mapToken],
  );

  const removeConditionFromToken = useCallback(
    (tokenId: string, tokenConditionId: string) => {
      mapToken(tokenId, (token) =>
        deleteConditionFromToken(token, tokenConditionId),
      );
    },
    [mapToken],
  );

  const updateConditionOnToken = useCallback(
    (tokenId: string, tokenConditionId: string, input: StatTokenConditionInput) => {
      mapToken(tokenId, (token) =>
        patchConditionOnToken(token, tokenConditionId, input),
      );
    },
    [mapToken],
  );

  const decrementConditionDuration = useCallback(
    (tokenId: string, tokenConditionId: string) => {
      mapToken(tokenId, (token) =>
        decrementDurationFromToken(token, tokenConditionId),
      );
    },
    [mapToken],
  );

  const clearConditionDuration = useCallback(
    (tokenId: string, tokenConditionId: string) => {
      mapToken(tokenId, (token) =>
        clearConditionDurationFromToken(token, tokenConditionId),
      );
    },
    [mapToken],
  );

  const applyPresetToToken = useCallback(
    (tokenId: string) => {
      setState((current) => {
        const nextTokens = current.tokens.map((token) => {
          if (token.id !== tokenId) return token;

          const missingTrackers = getMissingPresetTrackerInputs(
            token.tokenType,
            token.trackers,
            current.presets,
          ).map(createTracker);

          if (missingTrackers.length === 0) return token;

          return missingTrackers.reduce(
            (nextToken, tracker) => addTrackerToToken(nextToken, tracker),
            token,
          );
        });

        return touch({ ...current, tokens: nextTokens });
      });
    },
    [],
  );

  const updateTracker = useCallback(
    (
      tokenId: string,
      trackerId: string,
      patch: Partial<StatTrackerInput>,
    ) => {
      mapToken(tokenId, (token) =>
        updateTokenTracker(token, trackerId, (tracker) =>
          patchTracker(tracker, patch),
        ),
      );
    },
    [mapToken],
  );

  const removeTracker = useCallback(
    (tokenId: string, trackerId: string) => {
      mapToken(tokenId, (token) => removeTrackerFromToken(token, trackerId));
    },
    [mapToken],
  );

  const changeTrackerValue = useCallback(
    (tokenId: string, trackerId: string, delta: number) => {
      mapToken(tokenId, (token) =>
        updateTokenTracker(token, trackerId, (tracker) =>
          changeValue(tracker, delta),
        ),
      );
    },
    [mapToken],
  );

  const setTrackerValue = useCallback(
    (tokenId: string, trackerId: string, value: number) => {
      mapToken(tokenId, (token) =>
        updateTokenTracker(token, trackerId, (tracker) =>
          setValue(tracker, value),
        ),
      );
    },
    [mapToken],
  );

  const toggleTracker = useCallback(
    (tokenId: string, trackerId: string) => {
      mapToken(tokenId, (token) =>
        updateTokenTracker(token, trackerId, toggleValue),
      );
    },
    [mapToken],
  );

  const addTrackerToPresetForType = useCallback(
    (tokenType: StatTokenType, input: StatTrackerInput) => {
      setState((current) =>
        touch({
          ...current,
          presets: addTrackerToPreset(current.presets, tokenType, input),
        }),
      );
    },
    [],
  );

  const removeTrackerFromPresetForType = useCallback(
    (tokenType: StatTokenType, trackerIndex: number) => {
      setState((current) =>
        touch({
          ...current,
          presets: removeTrackerInputFromPreset(
            current.presets,
            tokenType,
            trackerIndex,
          ),
        }),
      );
    },
    [],
  );

  const resetPreset = useCallback((tokenType: StatTokenType) => {
    setState((current) =>
      touch({
        ...current,
        presets: resetPresetForTokenType(current.presets, tokenType),
      }),
    );
  }, []);

  const resetPresets = useCallback(() => {
    setState((current) =>
      touch({
        ...current,
        presets: resetAllStatPresets(),
      }),
    );
  }, []);

  const resetTracker = useCallback(() => {
    resetStatTrackerState().then(setState);
  }, []);

  const displayGroups = useMemo(() => getDisplayGroups(state), [state]);
  const trackedTokens = useMemo(
    () => tokens.filter((token) => token.isTracked !== false),
    [tokens],
  );

  const summary = useMemo(() => {
    const trackerCount = trackedTokens.reduce(
      (total, token) => total + token.trackers.length,
      0,
    );
    const visibleOnTokenCount = trackedTokens.reduce(
      (total, token) => total + getTokenDisplayItems(token).length,
      0,
    );

    return {
      tokenCount: trackedTokens.length,
      trackerCount,
      groupCount: groups.filter((group) =>
        group.tokenIds.some((tokenId) =>
          trackedTokens.some((token) => token.id === tokenId),
        ),
      ).length,
      visibleOnTokenCount,
    };
  }, [groups, trackedTokens]);

  return {
    addConditionToToken,
    addItems,
    addToken,
    addTracker,
    addTrackerToPreset: addTrackerToPresetForType,
    applyPresetToToken,
    changeTrackerValue,
    clearConditionDuration,
    decrementConditionDuration,
    displayGroups,
    groups,
    presets,
    removeConditionFromToken,
    removeItems,
    removeToken,
    removeTracker,
    removeTrackerFromPreset: removeTrackerFromPresetForType,
    resetPreset,
    resetPresets,
    resetTracker,
    setTrackerValue,
    state,
    summary,
    toggleTracker,
    tokens,
    updateConditionOnToken,
    updateToken,
    updateTracker,
  };
}
