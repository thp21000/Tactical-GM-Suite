import type { Item } from "@owlbear-rodeo/sdk";
import type {
  StatDisplayGroup,
  StatTokenGroup,
  StatTokenInput,
  StatTokenType,
  StatTrackedToken,
  StatTracker,
  StatTrackerState,
} from "../statTypes";
import { createDefaultStatTrackerPresets } from "./statPresets";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function cleanOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function createEmptyStatTrackerState(): StatTrackerState {
  const timestamp = now();

  return {
    id: createId("stat-tracker"),
    tokens: [],
    groups: [],
    presets: createDefaultStatTrackerPresets(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createTrackedToken(input: StatTokenInput): StatTrackedToken {
  const timestamp = now();

  return {
    id: createId("stat-token"),
    sourceItemId: input.sourceItemId,
    name: input.name.trim() || "Token",
    tokenType: input.tokenType,
    trackers: [],
    groupId: undefined,
    assignedPlayerId: cleanOptionalText(input.assignedPlayerId),
    assignedPlayerName: cleanOptionalText(input.assignedPlayerName),
    notes: cleanOptionalText(input.notes),
    isHiddenFromPlayers: input.isHiddenFromPlayers ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createTrackedTokenFromObrItem(item: Item): StatTrackedToken {
  return createTrackedToken({
    sourceItemId: item.id,
    name: item.name || "Token",
    tokenType: "other",
  });
}

export function updateTrackedToken(
  token: StatTrackedToken,
  patch: Partial<StatTokenInput>,
): StatTrackedToken {
  return {
    ...token,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() || "Token" : token.name,
    assignedPlayerId:
      patch.assignedPlayerId !== undefined
        ? cleanOptionalText(patch.assignedPlayerId)
        : token.assignedPlayerId,
    assignedPlayerName:
      patch.assignedPlayerName !== undefined
        ? cleanOptionalText(patch.assignedPlayerName)
        : token.assignedPlayerName,
    notes:
      patch.notes !== undefined ? cleanOptionalText(patch.notes) : token.notes,
    updatedAt: now(),
  };
}

export function addTrackerToToken(
  token: StatTrackedToken,
  tracker: StatTracker,
): StatTrackedToken {
  return {
    ...token,
    trackers: [...token.trackers, tracker],
    updatedAt: now(),
  };
}

export function updateTokenTracker(
  token: StatTrackedToken,
  trackerId: string,
  patch: (tracker: StatTracker) => StatTracker,
): StatTrackedToken;
export function updateTokenTracker(
  token: StatTrackedToken,
  trackerId: string,
  patch: Partial<StatTracker>,
): StatTrackedToken;
export function updateTokenTracker(
  token: StatTrackedToken,
  trackerId: string,
  patch: Partial<StatTracker> | ((tracker: StatTracker) => StatTracker),
): StatTrackedToken {
  return {
    ...token,
    trackers: token.trackers.map((tracker) =>
      tracker.id === trackerId
        ? typeof patch === "function"
          ? patch(tracker)
          : { ...tracker, ...patch, updatedAt: now() }
        : tracker,
    ),
    updatedAt: now(),
  };
}

export function removeTrackerFromToken(
  token: StatTrackedToken,
  trackerId: string,
): StatTrackedToken {
  return {
    ...token,
    trackers: token.trackers.filter((tracker) => tracker.id !== trackerId),
    updatedAt: now(),
  };
}

export function createTokenGroup(input: {
  name: string;
  tokenIds?: string[];
  primaryTokenId?: string;
}): StatTokenGroup {
  const timestamp = now();

  return {
    id: createId("stat-group"),
    name: input.name.trim() || "Groupe",
    tokenIds: input.tokenIds ?? [],
    primaryTokenId: input.primaryTokenId,
    isCollapsed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function addTokenToGroup(
  state: StatTrackerState,
  tokenId: string,
  groupId: string,
): StatTrackerState {
  return {
    ...state,
    tokens: state.tokens.map((token) =>
      token.id === tokenId ? { ...token, groupId, updatedAt: now() } : token,
    ),
    groups: state.groups.map((group) =>
      group.id === groupId && !group.tokenIds.includes(tokenId)
        ? { ...group, tokenIds: [...group.tokenIds, tokenId], updatedAt: now() }
        : group,
    ),
    updatedAt: now(),
  };
}

export function removeTokenFromGroup(
  state: StatTrackerState,
  tokenId: string,
): StatTrackerState {
  return {
    ...state,
    tokens: state.tokens.map((token) =>
      token.id === tokenId
        ? { ...token, groupId: undefined, updatedAt: now() }
        : token,
    ),
    groups: state.groups.map((group) =>
      group.tokenIds.includes(tokenId)
        ? {
            ...group,
            tokenIds: group.tokenIds.filter((id) => id !== tokenId),
            updatedAt: now(),
          }
        : group,
    ),
    updatedAt: now(),
  };
}

export function getDisplayGroups(state: StatTrackerState): StatDisplayGroup[] {
  const groupedTokenIds = new Set<string>();

  const groups = state.groups
    .map((group) => {
      const tokens = group.tokenIds
        .map((tokenId) => state.tokens.find((token) => token.id === tokenId))
        .filter((token): token is StatTrackedToken => Boolean(token));

      tokens.forEach((token) => groupedTokenIds.add(token.id));

      return {
        id: group.id,
        name: group.name,
        tokens,
        isGroup: true,
        isCollapsed: group.isCollapsed,
      } satisfies StatDisplayGroup;
    })
    .filter((group) => group.tokens.length > 0);

  const looseTokens = state.tokens
    .filter((token) => !groupedTokenIds.has(token.id))
    .map(
      (token) =>
        ({
          id: token.id,
          name: token.name,
          tokens: [token],
          isGroup: false,
          isCollapsed: false,
        }) satisfies StatDisplayGroup,
    );

  return [...groups, ...looseTokens];
}

export function normalizeTokenType(value: unknown): StatTokenType {
  if (value === "pc" || value === "npc" || value === "object") return value;
  if (value === "creature" || value === "enemy") return "enemy";
  if (value === "hazard" || value === "trap") return "trap";
  if (value === "mount" || value === "familiar" || value === "other") return value;

  return "other";
}
