import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import { STAT_OVERLAY_METADATA_KEY } from "./statTokenOverlayObrAdapter";
import {
  canUseObrOverlaySync,
  createOrUpdateTokenOverlay as createOrUpdateTokenOverlayV14,
  deleteTokenOverlay,
  findExistingStatsOverlay,
  type StatOverlayObrExistingOverlay,
  type StatOverlayObrManualAction,
  type StatOverlayObrSyncResult,
  type StatOverlayObrSyncStatus,
} from "./statTokenOverlayObrSyncV14";

export {
  canUseObrOverlaySync,
  deleteTokenOverlay,
  findExistingStatsOverlay,
};
export type {
  StatOverlayObrExistingOverlay,
  StatOverlayObrManualAction,
  StatOverlayObrSyncResult,
  StatOverlayObrSyncStatus,
};

type OverlayMutableApi = Pick<
  typeof OBR.scene.items,
  "getItems" | "updateItems"
>;

type PositionAdjustment = {
  dx: number;
  dy: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDockElementForSource(item: Item, sourceItemId: string): boolean {
  const metadata = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  return isRecord(metadata) && metadata.sourceItemId === sourceItemId;
}

function getPositionAdjustment(item: Item): PositionAdjustment | undefined {
  if (item.type === "LABEL") {
    const width = typeof item.text.width === "number" ? item.text.width : 0;
    const height = typeof item.text.height === "number" ? item.text.height : 0;
    return { dx: width / 2, dy: height / 2 };
  }

  if (item.type === "SHAPE") {
    return { dx: -item.width / 2, dy: -item.height / 2 };
  }

  return undefined;
}

/**
 * V14 a confirmé que les layers séparés règlent l'empilement, mais a également
 * révélé deux conventions d'ancrage différentes dans Owlbear :
 * - Label : la position correspond au centre de sa boîte screen-space ;
 * - Shape : notre layout calcule la position logique depuis le coin supérieur gauche.
 *
 * Cette passe ne touche donc qu'à la position des Label et Shape après leur
 * création. Les plaques et icônes conservent exactement leur géométrie V14.
 */
async function realignDockElements(
  api: OverlayMutableApi,
  sourceItemId: string,
): Promise<void> {
  const items = await api.getItems();
  const targets = items.filter((item) =>
    isDockElementForSource(item, sourceItemId),
  );
  if (targets.length === 0) return;

  const adjustments = new Map<string, PositionAdjustment>();
  for (const item of targets) {
    const adjustment = getPositionAdjustment(item);
    if (adjustment) adjustments.set(item.id, adjustment);
  }
  if (adjustments.size === 0) return;

  await api.updateItems(
    [...adjustments.keys()],
    (drafts) => {
      for (const draft of drafts) {
        const adjustment = adjustments.get(draft.id);
        if (!adjustment) continue;
        draft.position = {
          x: draft.position.x + adjustment.dx,
          y: draft.position.y + adjustment.dy,
        };
      }
    },
  );
}

export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const result = await createOrUpdateTokenOverlayV14(token);
  const sourceItemId = token.sourceItemId;

  if (
    !sourceItemId ||
    (result.status !== "created" && result.status !== "updated")
  ) {
    return result;
  }

  try {
    await Promise.all([
      realignDockElements(OBR.scene.items, sourceItemId),
      realignDockElements(OBR.scene.local, sourceItemId),
    ]);
    return result;
  } catch (error) {
    return {
      ...result,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Erreur Owlbear pendant le réalignement du Stat Dock.",
    };
  }
}
