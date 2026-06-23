import type { StatTrackedToken, StatTracker } from "../statTypes";

export function getTrackerPercent(tracker: StatTracker): number | undefined {
  if (tracker.visualType !== "bar" || !tracker.max || tracker.max <= 0) return undefined;
  return Math.max(0, Math.min(100, ((tracker.current ?? 0) / tracker.max) * 100));
}

export function getTokenTrackerCount(token: StatTrackedToken): number {
  return token.trackers.length;
}

export function getVisibleOnTokenCount(tokens: StatTrackedToken[]): number {
  return tokens.reduce((total, token) => total + token.trackers.filter((tracker) => tracker.showOnToken).length, 0);
}
