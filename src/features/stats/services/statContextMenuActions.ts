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
import {
  clearConditionOnlyStatHostMarker,
  isConditionOnlyStatHost,
  writeEmbeddedStatToken,
} from "./statEmbeddedProfileActions";
import { createOrUpdateTokenConditionOverlay } from "./statConditionOverlayObrSync";
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
    const conditionOnly = isConditionOnlyStatHost(item);

    let token: StatTrackedToken;
    if (embedded && conditionOnly) {
      const initialized = await createTokenForItem(item);
      token = {
        ...initialized,
        id: embedded.id,
        sourceItemId: item.id,
        conditions: embedded.conditions,
        createdAt: embedded.createdAt,
        isTracked: true,
        updatedAt: now(),
      };
    } else if (embedded) {
      token = {
        ...embedded,
        sourceItemId: item.id,
        isTracked: true,
        updatedAt: now(),
      };
    } else {
      token = await createTokenForItem(item);
    }

    const stored = await writeEmbeddedStatToken(item, token, true);
    if (conditionOnly) {
      await clearConditionOnlyStatHostMarker(item.id).catch(() => undefined);
    }
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
    // Les conditions sont indépendantes du Stat Tracker : elles restent
    // visibles et modifiables même lorsque le token n'est plus suivi.
    await createOrUpdateTokenConditionOverlay(stored).catch(() => undefined);
  }
}
