import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken, StatTracker } from "../statTypes";
import {
  STAT_TOKEN_LINK_KIND,
  STAT_TOKEN_LINK_METADATA_KEY,
  STAT_TOKEN_PROFILE_VERSION,
  readEmbeddedStatToken,
  type StatTokenLinkMetadata,
  type StatTokenProfileMetadata,
} from "./statTokenSceneLinks";

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

export function createEmbeddedStatTokenMetadata(
  token: StatTrackedToken,
  tracked = token.isTracked !== false,
): StatTokenLinkMetadata {
  return {
    kind: STAT_TOKEN_LINK_KIND,
    tokenId: token.id,
    tracked,
    profile: serializeProfile(token),
  };
}

export async function writeEmbeddedStatToken(
  item: Item,
  token: StatTrackedToken,
  tracked = token.isTracked !== false,
): Promise<StatTrackedToken> {
  const nextToken: StatTrackedToken = {
    ...token,
    sourceItemId: item.id,
    isTracked: tracked,
    isItemMetadataSynced: true,
  };

  await OBR.scene.items.updateItems([item], (drafts) => {
    const [draft] = drafts;
    if (!draft) return;
    draft.metadata[STAT_TOKEN_LINK_METADATA_KEY] = createEmbeddedStatTokenMetadata(
      nextToken,
      tracked,
    );
  });

  return nextToken;
}

export async function updateEmbeddedStatToken(
  itemId: string,
  update: (token: StatTrackedToken) => StatTrackedToken,
): Promise<StatTrackedToken | undefined> {
  const [item] = await OBR.scene.items.getItems([itemId]);
  if (!item) return undefined;

  const current = readEmbeddedStatToken(item);
  if (!current) return undefined;

  const updated = update({ ...current, sourceItemId: item.id });
  return writeEmbeddedStatToken(item, updated, updated.isTracked !== false);
}
