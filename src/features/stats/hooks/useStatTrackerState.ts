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
import {
  clearCurrentSceneStatTokenMetadata,
  getEmbeddedStatTokens,
  getLinkedStatTokenId,
  readEmbeddedStatToken,
} from "../services/statTokenSceneLinks";
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

function timeValue(value: string | undefined): number {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function markItemProfileDirty(token: StatTrackedToken): StatTrackedToken {
  return token.sourceItemId
    ? { ...token, isItemMetadataSynced: false }
    : token;
}

function tokenRuntimeKey(token: StatTrackedToken): string {
  return [
    token.id,
    token.sourceItemId ?? "manual",
    token.updatedAt,
    token.isTracked === false ? "off" : "on",
    token.isItemMetadataSynced === true
      ? "synced"
      : token.isItemMetadataSynced === false
        ? "dirty"
        : "manual",
  ].join("|");
}

function mergeRoomState(
  current: StatTrackerState,
  incoming: StatTrackerState,
): StatTrackerState {
  const tokenById = new Map(incoming.tokens.map((token) => [token.id, token]));

  for (const token of current.tokens) {
    if (!token.sourceItemId) continue;

    const roomToken = tokenById.get(token.id);
    if (
      !roomToken ||
      token.isItemMetadataSynced === true ||
      timeValue(token.updatedAt) >= timeValue(roomToken.updatedAt)
    ) {
      tokenById.set(token.id, token);
    }
  }

  return {
    ...incoming,
    tokens: [...tokenById.values()],
  };
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
    isItemMetadataSynced: input.sourceItemId ? false : undefined,
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
        setState((current) => mergeRoomState(current, next));
      })
      .catch(() => {
        // Keep the in-memory state and never enable writes after a failed read.
      });

    const unsubscribe = subscribeToStatTrackerState((next) => {
      if (!mounted) return;
      hasLoaded.current = true;
      setState((current) => mergeRoomState(current, next));
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

  const hydrateSceneItems = useCallback((items: Item[]) => {
    const embeddedTokens = getEmbeddedStatTokens(items);
    const embeddedById = new Map<string, StatTrackedToken>();

    for (const token of embeddedTokens) {
      const existing = embeddedById.get(token.id);
      if (!existing || timeValue(token.updatedAt) > timeValue(existing.updatedAt)) {
        embeddedById.set(token.id, token);
      }
    }

    setState((current) => {
      const currentById = new Map(current.tokens.map((token) => [token.id, token]));
      const nextTokens = current.tokens.filter((token) => {
        if (!token.sourceItemId) return true;
        if (embeddedById.has(token.id)) return false;
        return token.isItemMetadataSynced !== true;
      });

      for (const embedded of embeddedById.values()) {
        const currentToken = currentById.get(embedded.id);
        let nextToken = embedded;

        if (
          currentToken &&
          timeValue(currentToken.updatedAt) > timeValue(embedded.updatedAt)
        ) {
          nextToken = {
            ...currentToken,
            sourceItemId: embedded.sourceItemId,
            isItemMetadataSynced: false,
          };
        }

        nextTokens.push(nextToken);
      }

      const changed =
        nextTokens.length !== current.tokens.length ||
        nextTokens.some(
          (token, index) =>
            tokenRuntimeKey(token) !== tokenRuntimeKey(current.tokens[index]),
        );

      return changed ? touch({ ...current, tokens: nextTokens }) : current;
    });
  }, []);

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
        const embedded = readEmbeddedStatToken(item);
        const existingIndex = nextTokens.findIndex(
          (token) =>
            token.sourceItemId === item.id ||
            (linkedTokenId !== undefined && token.id === linkedTokenId) ||
            (embedded !== undefined && token.id === embedded.id),
        );

        if (existingIndex >= 0) {
          const existing = nextTokens[existingIndex];
          if (existing && existing.isTracked === false) {
            nextTokens[existingIndex] = {
              ...existing,
              isTracked: true,
              isItemMetadataSynced: existing.sourceItemId ? false : undefined,
              updatedAt: now(),
            };
            changed = true;
          }
          continue;
        }

        if (embedded) {
          nextTokens.push({
            ...embedded,
            sourceItemId: item.id,
            isTracked: true,
            isItemMetadataSynced: false,
            updatedAt: now(),
          });
          changed = true;
          continue;
        }

        const created = createTokenFromObrItemWithPreset(item, current);
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
        return {
          ...token,
          isTracked: false,
          isItemMetadataSynced: token.sourceItemId ? false : undefined,
          updatedAt: now(),
        };
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
            token.id === tokenId
              ? markItemProfileDirty(updateTrackedToken(token, patch))
              : token,
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
        return {
          ...token,
          isTracked: false,
          isItemMetadataSynced: token.sourceItemId ? false : undefined,
          updatedAt: now(),
        };
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
            token.id === tokenId ? markItemProfileDirty(update(token)) : token,
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

  const applyPresetToToken = useCallback(
    (tokenId: string) => {
      setState((current) => {
        let changed = false;
        const nextTokens = current.tokens.map((token) => {
          if (token.id !== tokenId) return token;

          const missingTrackers = getMissingPresetTrackerInputs(
            token.tokenType,
            token.trackers,
            current.presets,
          ).map(createTracker);

          if (missingTrackers.length === 0) return token;
          changed = true;

          const updated = missingTrackers.reduce(
            (nextToken, tracker) => addTrackerToToken(nextToken, tracker),
            token,
          );
          return markItemProfileDirty(updated);
        });

        return changed ? touch({ ...current, tokens: nextTokens }) : current;
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
    void (async () => {
      if (OBR.isAvailable && isObrReady) {
        await clearCurrentSceneStatTokenMetadata().catch(() => undefined);
      }
      const next = await resetStatTrackerState();
      hasLoaded.current = true;
      setState(next);
    })();
  }, [isObrReady]);

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
    addItems,
    addToken,
    addTracker,
    addTrackerToPreset: addTrackerToPresetForType,
    applyPresetToToken,
    changeTrackerValue,
    displayGroups,
    groups,
    hydrateSceneItems,
    presets,
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
    updateToken,
    updateTracker,
  };
}
