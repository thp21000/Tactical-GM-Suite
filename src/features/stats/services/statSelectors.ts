import type { StatTrackedToken, StatTracker, StatTrackerState } from "../statTypes";

export function getTokenBySourceItemId(state: StatTrackerState, sourceItemId: string): StatTrackedToken | undefined {
  return state.tokens.find((token) => token.sourceItemId === sourceItemId);
}

export function getTrackerByName(token: StatTrackedToken, name: string): StatTracker | undefined {
  return token.trackers.find((tracker) => tracker.name.localeCompare(name, "fr", { sensitivity: "base" }) === 0);
}

export function getTrackerValue(token: StatTrackedToken, trackerName: string): number | boolean | undefined {
  const tracker = getTrackerByName(token, trackerName);
  if (!tracker) return undefined;
  if (tracker.visualType === "toggle") return tracker.enabled ?? false;
  if (tracker.visualType === "bar") return tracker.current;
  return tracker.value ?? tracker.current;
}

export function getAllTrackersByName(state: StatTrackerState, trackerName: string): StatTracker[] {
  return state.tokens.flatMap((token) => token.trackers.filter((tracker) => tracker.name.localeCompare(trackerName, "fr", { sensitivity: "base" }) === 0));
}
