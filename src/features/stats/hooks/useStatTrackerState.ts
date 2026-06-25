import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@owlbear-rodeo/sdk";
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
  removeConditionFromToken as deleteConditionFromToken,
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
import {
  readStatTrackerState,
  resetStatTrackerState,
  subscribeToStatTrackerState,
  writeStatTrackerState,
} from "../services/statStorage";

function touch(state: StatTrackerState): StatTrackerState {
  return { ...state, updatedAt: new Date().toISOString() };
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
    let mounted = true;

    readStatTrackerState().then((next) => {
      if (mounted) {
        hasLoaded.current = true;
        setState(next);
      }
    });

    const unsubscribe = subscribeToStatTrackerState((next) => {
      hasLoaded.current = true;
      setState(next);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isObrReady]);

  useEffect(() => {
    if (hasLoaded.current) {
      void writeStatTrackerState(state);
    }
  }, [state]);

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
      const existing = new Set(
        current.tokens.map((token) => token.sourceItemId).filter(Boolean),
      );

      const additions = items
        .filter((item) => !existing.has(item.id))
        .map((item) => createTokenFromObrItemWithPreset(item, current));

      return additions.length
        ? touch({ ...current, tokens: [...current.tokens, ...additions] })
        : current;
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
    setState((current) =>
      touch({
        ...current,
        tokens: current.tokens.filter((token) => token.id !== tokenId),
        groups: current.groups.map((group) => ({
          ...group,
          tokenIds: group.tokenIds.filter((id) => id !== tokenId),
        })),
      }),
    );
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

  const applyPresetToToken = useCallback(
    (tokenId: string) => {
      setState((current) => {
        const tokens = current.tokens.map((token) => {
          if (token.id !== tokenId) {
            return token;
          }

          const missingTrackers = getMissingPresetTrackerInputs(
            token.tokenType,
            token.trackers,
            current.presets,
          ).map(createTracker);

          if (missingTrackers.length === 0) {
            return token;
          }

          return missingTrackers.reduce(
            (nextToken, tracker) => addTrackerToToken(nextToken, tracker),
            token,
          );
        });

        return touch({ ...current, tokens });
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

  const summary = useMemo(() => {
    const trackerCount = tokens.reduce(
      (total, token) => total + token.trackers.length,
      0,
    );
    const visibleOnTokenCount = tokens.reduce(
      (total, token) =>
        total +
        token.trackers.filter((tracker) => tracker.showOnToken).length,
      0,
    );

    return {
      tokenCount: tokens.length,
      trackerCount,
      groupCount: groups.length,
      visibleOnTokenCount,
    };
  }, [groups.length, tokens]);

  return {
    addConditionToToken,
    addItems,
    addToken,
    addTracker,
    addTrackerToPreset: addTrackerToPresetForType,
    applyPresetToToken,
    changeTrackerValue,
    displayGroups,
    groups,
    presets,
    removeConditionFromToken,
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
    updateToken,
    updateTracker,
  };
}
