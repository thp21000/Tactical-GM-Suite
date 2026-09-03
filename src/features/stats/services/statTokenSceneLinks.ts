import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../../../core/constants/ids";
import { isObrReady } from "../../../core/obr/obrReady";
import type {
  StatTokenType,
  StatTrackedToken,
  StatTracker,
  StatTrackerVisibility,
  StatTrackerVisualType,
} from "../statTypes";
import { normalizeTokenConditions } from "./statConditionStorage";
import { normalizeTrackerIconId } from "./statTrackerIcons";
import { normalizeTokenType } from "./statTokens";

export const STAT_TOKEN_LINK_METADATA_KEY = `${EXTENSION_ID}/stats-token-link`;
export const STAT_TOKEN_LINK_KIND = "stats-token-link";
export const STAT_TOKEN_PROFILE_VERSION = 1;

export type StatTokenProfileMetadata = {
  version: typeof STAT_TOKEN_PROFILE_VERSION;
  name: string;
  tokenType: StatTokenType;
  trackers: StatTracker[];
  conditions: StatTrackedToken["conditions"];
  groupId?: string;
  assignedPlayerId?: string;
  assignedPlayerName?: string;
  notes?: string;
  isHiddenFromPlayers: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StatTokenLinkMetadata = {
  kind: typeof STAT_TOKEN_LINK_KIND;
  tokenId: string;
  tracked?: boolean;
  /** Résumé indexable par le filtre ContextMenu Owlbear. */
  playerEditable?: boolean;
  /** Copie indexable de l'assignation, utilisée par le menu rapide joueur. */
  assignedPlayerId?: string;
  profile?: StatTokenProfileMetadata;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isVisualType(value: unknown): value is StatTrackerVisualType {
  return (
    value === "icon" ||
    value === "bar" ||
    value === "counter" ||
    value === "readonly" ||
    value === "toggle"
  );
}

function isVisibility(value: unknown): value is StatTrackerVisibility {
  return value === "gm" || value === "private" || value === "public";
}

function normalizeEmbeddedTracker(value: unknown): StatTracker | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !isVisualType(value.visualType) ||
    typeof value.iconId !== "string"
  ) {
    return null;
  }

  const timestamp = new Date().toISOString();

  return {
    id: value.id,
    name: value.name,
    visualType: value.visualType,
    iconId: normalizeTrackerIconId(value.iconId),
    current: typeof value.current === "number" ? value.current : undefined,
    max: typeof value.max === "number" ? value.max : undefined,
    value: typeof value.value === "number" ? value.value : undefined,
    enabled: typeof value.enabled === "boolean" ? value.enabled : undefined,
    visibility: isVisibility(value.visibility) ? value.visibility : "gm",
    canPlayerEdit:
      typeof value.canPlayerEdit === "boolean" ? value.canPlayerEdit : false,
    showOnToken: typeof value.showOnToken === "boolean" ? value.showOnToken : false,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : timestamp,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : timestamp,
  };
}

function normalizeProfile(value: unknown): StatTokenProfileMetadata | undefined {
  if (!isRecord(value) || value.version !== STAT_TOKEN_PROFILE_VERSION) {
    return undefined;
  }
  if (typeof value.name !== "string") return undefined;

  const timestamp = new Date().toISOString();
  const trackers = Array.isArray(value.trackers)
    ? value.trackers
        .map(normalizeEmbeddedTracker)
        .filter((tracker): tracker is StatTracker => tracker !== null)
    : [];

  return {
    version: STAT_TOKEN_PROFILE_VERSION,
    name: value.name,
    tokenType: normalizeTokenType(value.tokenType),
    trackers,
    conditions: normalizeTokenConditions(value.conditions),
    groupId: cleanOptionalText(value.groupId),
    assignedPlayerId: cleanOptionalText(value.assignedPlayerId),
    assignedPlayerName: cleanOptionalText(value.assignedPlayerName),
    notes: cleanOptionalText(value.notes),
    isHiddenFromPlayers:
      typeof value.isHiddenFromPlayers === "boolean"
        ? value.isHiddenFromPlayers
        : false,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : timestamp,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : timestamp,
  };
}

function serializeTracker(tracker: StatTracker): StatTracker {
  const copy = { ...tracker };
  delete copy.skinId;
  return copy;
}

function serializeProfile(token: StatTrackedToken): StatTokenProfileMetadata {
  return {
    version: STAT_TOKEN_PROFILE_VERSION,
    name: token.name,
    tokenType: token.tokenType,
    trackers: token.trackers.map(serializeTracker),
    conditions: token.conditions,
    groupId: token.groupId,
    assignedPlayerId: token.assignedPlayerId,
    assignedPlayerName: token.assignedPlayerName,
    notes: token.notes,
    isHiddenFromPlayers: token.isHiddenFromPlayers,
    createdAt: token.createdAt,
    updatedAt: token.updatedAt,
  };
}

export function hasPlayerEditableTrackers(token: StatTrackedToken): boolean {
  return token.trackers.some((tracker) => tracker.canPlayerEdit === true);
}

export function readStatTokenLinkMetadata(
  item: Pick<Item, "metadata">,
): StatTokenLinkMetadata | undefined {
  const value = item.metadata?.[STAT_TOKEN_LINK_METADATA_KEY];
  if (!isRecord(value)) return undefined;
  if (value.kind !== STAT_TOKEN_LINK_KIND || typeof value.tokenId !== "string") {
    return undefined;
  }

  return {
    kind: STAT_TOKEN_LINK_KIND,
    tokenId: value.tokenId,
    tracked: typeof value.tracked === "boolean" ? value.tracked : undefined,
    playerEditable:
      typeof value.playerEditable === "boolean" ? value.playerEditable : undefined,
    assignedPlayerId: cleanOptionalText(value.assignedPlayerId),
    profile: normalizeProfile(value.profile),
  };
}

export function getLinkedStatTokenId(
  item: Pick<Item, "metadata">,
): string | undefined {
  return readStatTokenLinkMetadata(item)?.tokenId;
}

export function isStatTokenTrackedItem(
  item: Pick<Item, "metadata">,
): boolean {
  return readStatTokenLinkMetadata(item)?.tracked === true;
}

export function readEmbeddedStatToken(item: Item): StatTrackedToken | undefined {
  const link = readStatTokenLinkMetadata(item);
  if (!link?.profile) return undefined;

  return {
    id: link.tokenId,
    sourceItemId: item.id,
    name: link.profile.name,
    tokenType: link.profile.tokenType,
    trackers: link.profile.trackers,
    conditions: link.profile.conditions,
    groupId: link.profile.groupId,
    assignedPlayerId: link.profile.assignedPlayerId,
    assignedPlayerName: link.profile.assignedPlayerName,
    notes: link.profile.notes,
    isHiddenFromPlayers: link.profile.isHiddenFromPlayers,
    isTracked: link.tracked !== false,
    isItemMetadataSynced: true,
    createdAt: link.profile.createdAt,
    updatedAt: link.profile.updatedAt,
  };
}

export function getEmbeddedStatTokens(items: Item[]): StatTrackedToken[] {
  return items
    .map(readEmbeddedStatToken)
    .filter((token): token is StatTrackedToken => token !== undefined);
}

export function getSceneStatTokenInstances(
  tokens: StatTrackedToken[],
  items: Item[],
): StatTrackedToken[] {
  const tokenById = new Map(tokens.map((token) => [token.id, token]));
  const currentItemIds = new Set(items.map((item) => item.id));
  const itemIdsByTokenId = new Map<string, string[]>();

  for (const item of items) {
    const tokenId = getLinkedStatTokenId(item);
    if (!tokenId || !tokenById.has(tokenId)) continue;

    const existing = itemIdsByTokenId.get(tokenId) ?? [];
    existing.push(item.id);
    itemIdsByTokenId.set(tokenId, existing);
  }

  const instances: StatTrackedToken[] = [];

  for (const token of tokens) {
    if (token.isTracked === false) continue;

    const linkedItemIds = [...(itemIdsByTokenId.get(token.id) ?? [])];

    if (
      token.sourceItemId &&
      currentItemIds.has(token.sourceItemId) &&
      !linkedItemIds.includes(token.sourceItemId)
    ) {
      linkedItemIds.unshift(token.sourceItemId);
    }

    if (linkedItemIds.length === 0) {
      if (!token.sourceItemId) instances.push(token);
      continue;
    }

    for (const sourceItemId of linkedItemIds) {
      instances.push({ ...token, sourceItemId });
    }
  }

  return instances;
}

export async function ensureCurrentSceneStatTokenLinks(
  tokens: StatTrackedToken[],
  items: Item[],
): Promise<void> {
  if (!isObrReady() || items.length === 0) return;

  const tokenById = new Map(tokens.map((token) => [token.id, token]));
  const tokenBySourceItemId = new Map(
    tokens.flatMap((token) =>
      token.sourceItemId ? ([[token.sourceItemId, token]] as const) : [],
    ),
  );

  const tokenForItem = (item: Item): StatTrackedToken | undefined => {
    const linkedTokenId = getLinkedStatTokenId(item);
    if (linkedTokenId) {
      const linkedToken = tokenById.get(linkedTokenId);
      if (linkedToken) return linkedToken;
    }

    return tokenBySourceItemId.get(item.id);
  };

  const targets = items.filter((item) => {
    const token = tokenForItem(item);
    if (!token) return false;

    const existing = readStatTokenLinkMetadata(item);
    const tracked = token.isTracked !== false;
    const playerEditable = hasPlayerEditableTrackers(token);
    return (
      existing?.tokenId !== token.id ||
      existing.tracked !== tracked ||
      existing.playerEditable !== playerEditable ||
      existing.assignedPlayerId !== token.assignedPlayerId ||
      existing.profile?.version !== STAT_TOKEN_PROFILE_VERSION ||
      existing.profile?.updatedAt !== token.updatedAt
    );
  });

  if (targets.length === 0) return;

  await OBR.scene.items.updateItems(targets, (drafts) => {
    for (const draft of drafts) {
      const token = tokenForItem(draft);
      if (!token) continue;

      draft.metadata[STAT_TOKEN_LINK_METADATA_KEY] = {
        kind: STAT_TOKEN_LINK_KIND,
        tokenId: token.id,
        tracked: token.isTracked !== false,
        playerEditable: hasPlayerEditableTrackers(token),
        assignedPlayerId: token.assignedPlayerId,
        profile: serializeProfile(token),
      } satisfies StatTokenLinkMetadata;
    }
  });
}

export async function clearCurrentSceneStatTokenMetadata(): Promise<void> {
  if (!isObrReady()) return;

  const items = await OBR.scene.items.getItems();
  const targets = items.filter((item) =>
    Boolean(item.metadata?.[STAT_TOKEN_LINK_METADATA_KEY]),
  );
  if (targets.length === 0) return;

  await OBR.scene.items.updateItems(targets, (drafts) => {
    for (const draft of drafts) {
      delete draft.metadata[STAT_TOKEN_LINK_METADATA_KEY];
    }
  });
}
