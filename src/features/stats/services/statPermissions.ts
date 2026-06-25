import type { StatTrackedToken, StatTracker } from "../statTypes";

export type StatPermissionViewer =
  | { role: "gm" }
  | {
      role: "player";
      playerId?: string;
      playerName?: string;
    };

export const GM_VIEWER = { role: "gm" } as const satisfies StatPermissionViewer;

function normalize(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLocaleLowerCase("fr") : undefined;
}

export function isTokenAssignedToViewer(
  token: StatTrackedToken,
  viewer: StatPermissionViewer,
): boolean {
  if (viewer.role === "gm") return true;

  const viewerId = normalize(viewer.playerId);
  const viewerName = normalize(viewer.playerName);
  const assignedId = normalize(token.assignedPlayerId);
  const assignedName = normalize(token.assignedPlayerName);

  if (!assignedId && !assignedName) return false;
  if (viewerId && assignedId && viewerId === assignedId) return true;
  if (viewerName && assignedName && viewerName === assignedName) return true;

  return false;
}

export function canViewerSeeTracker(
  token: StatTrackedToken,
  tracker: StatTracker,
  viewer: StatPermissionViewer,
): boolean {
  if (viewer.role === "gm") return true;
  if (tracker.visibility === "gm") return false;
  if (tracker.visibility === "public") return true;
  return isTokenAssignedToViewer(token, viewer);
}

export function canViewerEditTracker(
  token: StatTrackedToken,
  tracker: StatTracker,
  viewer: StatPermissionViewer,
): boolean {
  if (viewer.role === "gm") return true;
  if (tracker.visibility === "gm") return false;
  if (!tracker.canPlayerEdit) return false;
  return isTokenAssignedToViewer(token, viewer);
}


export function filterTrackersForViewer(
  token: StatTrackedToken,
  viewer: StatPermissionViewer,
): StatTracker[] {
  if (viewer.role === "gm") return token.trackers;
  return token.trackers.filter((tracker) => canViewerSeeTracker(token, tracker, viewer));
}

export function filterTokensForViewer(
  tokens: StatTrackedToken[],
  viewer: StatPermissionViewer,
): StatTrackedToken[] {
  if (viewer.role === "gm") return tokens;

  return tokens
    .map((token) => ({ ...token, trackers: filterTrackersForViewer(token, viewer) }))
    .filter((token) => token.trackers.length > 0);
}

export function getTrackerVisibilityBadgeLabel(tracker: StatTracker): string {
  if (tracker.visibility === "public") return "Public";
  if (tracker.visibility === "private") return "Privé";
  return "MJ";
}

export function getTrackerEditBadgeLabel(
  _token: StatTrackedToken,
  tracker: StatTracker,
): string {
  return tracker.canPlayerEdit ? "Joueur mod." : "Lecture seule";
}

export function getTrackerPermissionSummary(
  token: StatTrackedToken,
  tracker: StatTracker,
): string {
  return `${getTrackerVisibilityBadgeLabel(tracker)} · ${getTrackerEditBadgeLabel(token, tracker)}`;
}
