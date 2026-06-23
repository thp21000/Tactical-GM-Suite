import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@owlbear-rodeo/sdk";
import type { StatTokenInput, StatTrackedToken, StatTrackerInput, StatTrackerState } from "../statTypes";
import { changeTrackerValue as changeValue, createTracker, setTrackerValue as setValue, toggleTracker as toggleValue, updateTracker as patchTracker } from "../services/statTrackers";
import { addTrackerToToken, createEmptyStatTrackerState, createTrackedToken, createTrackedTokenFromObrItem, getDisplayGroups, removeTrackerFromToken, updateTokenTracker, updateTrackedToken } from "../services/statTokens";
import { readStatTrackerState, resetStatTrackerState, subscribeToStatTrackerState, writeStatTrackerState } from "../services/statStorage";

function touch(state: StatTrackerState): StatTrackerState {
  return { ...state, updatedAt: new Date().toISOString() };
}

export function useStatTrackerState(isObrReady: boolean) {
  const [state, setState] = useState<StatTrackerState>(() => createEmptyStatTrackerState());
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
    if (hasLoaded.current) void writeStatTrackerState(state);
  }, [state]);

  const tokens = state.tokens;
  const groups = state.groups;

  const addToken = useCallback((input: StatTokenInput) => {
    setState((current) => touch({ ...current, tokens: [...current.tokens, createTrackedToken(input)] }));
  }, []);

  const addItems = useCallback((items: Item[]) => {
    setState((current) => {
      const existing = new Set(current.tokens.map((token) => token.sourceItemId).filter(Boolean));
      const additions = items.filter((item) => !existing.has(item.id)).map(createTrackedTokenFromObrItem);
      return additions.length ? touch({ ...current, tokens: [...current.tokens, ...additions] }) : current;
    });
  }, []);

  const updateToken = useCallback((tokenId: string, patch: Partial<StatTokenInput>) => {
    setState((current) => touch({ ...current, tokens: current.tokens.map((token) => token.id === tokenId ? updateTrackedToken(token, patch) : token) }));
  }, []);

  const removeToken = useCallback((tokenId: string) => {
    setState((current) => touch({ ...current, tokens: current.tokens.filter((token) => token.id !== tokenId), groups: current.groups.map((group) => ({ ...group, tokenIds: group.tokenIds.filter((id) => id !== tokenId) })) }));
  }, []);

  const mapToken = useCallback((tokenId: string, update: (token: StatTrackedToken) => StatTrackedToken) => {
    setState((current) => touch({ ...current, tokens: current.tokens.map((token) => token.id === tokenId ? update(token) : token) }));
  }, []);

  const addTracker = useCallback((tokenId: string, input: StatTrackerInput) => {
    mapToken(tokenId, (token) => addTrackerToToken(token, createTracker(input)));
  }, [mapToken]);

  const updateTracker = useCallback((tokenId: string, trackerId: string, patch: Partial<StatTrackerInput>) => {
    mapToken(tokenId, (token) => updateTokenTracker(token, trackerId, (tracker) => patchTracker(tracker, patch)));
  }, [mapToken]);

  const removeTracker = useCallback((tokenId: string, trackerId: string) => {
    mapToken(tokenId, (token) => removeTrackerFromToken(token, trackerId));
  }, [mapToken]);

  const changeTrackerValue = useCallback((tokenId: string, trackerId: string, delta: number) => {
    mapToken(tokenId, (token) => updateTokenTracker(token, trackerId, (tracker) => changeValue(tracker, delta)));
  }, [mapToken]);

  const setTrackerValue = useCallback((tokenId: string, trackerId: string, value: number) => {
    mapToken(tokenId, (token) => updateTokenTracker(token, trackerId, (tracker) => setValue(tracker, value)));
  }, [mapToken]);

  const toggleTracker = useCallback((tokenId: string, trackerId: string) => {
    mapToken(tokenId, (token) => updateTokenTracker(token, trackerId, toggleValue));
  }, [mapToken]);

  const resetTracker = useCallback(() => {
    resetStatTrackerState().then(setState);
  }, []);

  const displayGroups = useMemo(() => getDisplayGroups(state), [state]);
  const summary = useMemo(() => {
    const trackerCount = tokens.reduce((total, token) => total + token.trackers.length, 0);
    const visibleOnTokenCount = tokens.reduce((total, token) => total + token.trackers.filter((tracker) => tracker.showOnToken).length, 0);
    return { tokenCount: tokens.length, trackerCount, groupCount: groups.length, visibleOnTokenCount };
  }, [groups.length, tokens]);

  return {
    addItems,
    addToken,
    addTracker,
    changeTrackerValue,
    displayGroups,
    groups,
    removeToken,
    removeTracker,
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
