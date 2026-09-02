import type { Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import { createTrackersFromPreset } from "./statPresets";
import { readStatTrackerState } from "./statStorage";
import { createTracker } from "./statTrackers";
import { createTrackedToken } from "./statTokens";
import {
  readEmbeddedStatToken,
  readStatTokenLinkMetadata,
} from "./statTokenSceneLinks";
import { writeEmbeddedStatToken } from "./statEmbeddedProfileActions";
import {
  createOrUpdateTokenConditionOverlay,
  deleteTokenConditionOverlay,
} from "./statConditionOverlayObrSync";
import {
  createOrUpdateTokenOverlay,
  deleteTokenOverlay,
} from "./statTokenOverlayObrSync";

function now(): string {
  return new Date().toISOString();
}

async function createTokenForItem(item: Item): Promise<StatTrackedToken> {
  const state = await readStatTrackerState();
  const token = createTrackedToken({
    sourceItemId: item.id,
    name: item.name || "Token",
    tokenType: "enemy",
  });
  const existingLink = readStatTokenLinkMetadata(item);
  if (existingLink?.tokenId) token.id = existingLink.tokenId;

  return {
    ...token,
    trackers: createTrackersFromPreset("enemy", state.presets).map(createTracker),
  };
}

export async function addSceneItemsToStatTracker(items: Item[]): Promise<void> {
  for (const item of items) {
    const embedded = readEmbeddedStatToken(item);
    const token = embedded
      ? {
          ...embedded,
          sourceItemId: item.id,
          isTracked: true,
          updatedAt: now(),
        }
      : await createTokenForItem(item);

    const stored = await writeEmbeddedStatToken(item, token, true);
    await createOrUpdateTokenOverlay(stored).catch(() => undefined);
    await createOrUpdateTokenConditionOverlay(stored).catch(() => undefined);
  }
}

export async function removeSceneItemsFromStatTracker(items: Item[]): Promise<void> {
  for (const item of items) {
    const embedded = readEmbeddedStatToken(item);
    if (!embedded) continue;

    const stored = await writeEmbeddedStatToken(
      item,
      {
        ...embedded,
        sourceItemId: item.id,
        isTracked: false,
        updatedAt: now(),
      },
      false,
    );

    await deleteTokenOverlay(stored).catch(() => undefined);
    await deleteTokenConditionOverlay(stored).catch(() => undefined);
  }
}
