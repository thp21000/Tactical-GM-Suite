import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../../../core/constants/ids";
import type { StatTrackedToken, StatTracker } from "../statTypes";
import { createTrackedToken } from "./statTokens";
import {
  STAT_TOKEN_LINK_KIND,
  STAT_TOKEN_LINK_METADATA_KEY,
  STAT_TOKEN_PROFILE_VERSION,
  readEmbeddedStatToken,
  type StatTokenLinkMetadata,
  type StatTokenProfileMetadata,
} from "./statTokenSceneLinks";

export const STAT_CONDITION_ONLY_HOST_METADATA_KEY = `${EXTENSION_ID}/stats-condition-host`;

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

export function isConditionOnlyStatHost(item: Pick<Item, "metadata">): boolean {
  return item.metadata?.[STAT_CONDITION_ONLY_HOST_METADATA_KEY] === true;
}

export async function clearConditionOnlyStatHostMarker(itemId: string): Promise<void> {
  await OBR.scene.items.updateItems([itemId], (drafts) => {
    const [draft] = drafts;
    if (!draft) return;
    delete draft.metadata[STAT_CONDITION_ONLY_HOST_METADATA_KEY];
  });
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

/**
 * Conditions and Stat Tracker are independent features.
 *
 * A token that has never been added to the Stat Tracker can still receive
 * conditions. In that case we create a lightweight dormant profile only to
 * persist the condition data on the Owlbear item. The marker lets the Stat
 * Tracker know that it must still initialise its normal preset the first time
 * the token is actually added to the tracker.
 */
export async function updateOrCreateEmbeddedConditionToken(
  itemId: string,
  update: (token: StatTrackedToken) => StatTrackedToken,
): Promise<StatTrackedToken | undefined> {
  const [item] = await OBR.scene.items.getItems([itemId]);
  if (!item) return undefined;

  const current = readEmbeddedStatToken(item);
  if (current) {
    const updated = update({ ...current, sourceItemId: item.id });
    return writeEmbeddedStatToken(item, updated, updated.isTracked !== false);
  }

  const host: StatTrackedToken = {
    ...createTrackedToken({
      sourceItemId: item.id,
      name: item.name || "Token",
      tokenType: "enemy",
    }),
    trackers: [],
    conditions: [],
    isTracked: false,
  };
  const updated: StatTrackedToken = {
    ...update(host),
    sourceItemId: item.id,
    isTracked: false,
    isItemMetadataSynced: true,
  };

  await OBR.scene.items.updateItems([item], (drafts) => {
    const [draft] = drafts;
    if (!draft) return;
    draft.metadata[STAT_TOKEN_LINK_METADATA_KEY] = createEmbeddedStatTokenMetadata(
      updated,
      false,
    );
    draft.metadata[STAT_CONDITION_ONLY_HOST_METADATA_KEY] = true;
  });

  return updated;
}
