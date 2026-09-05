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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDockElementForSource(item: Item, sourceItemId: string): boolean {
  const metadata = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  return isRecord(metadata) && metadata.sourceItemId === sourceItemId;
}

/**
 * V14 a confirmé que les layers séparés règlent l'empilement, mais a également
 * révélé deux conventions d'ancrage différentes dans Owlbear :
 * - Label : la position correspond au centre de sa boîte screen-space ;
 * - Shape : la position utilisée par notre layout doit rester le coin logique.
 *
 * Le renderer construit volontairement ses cellules en coordonnées haut-gauche.
 * Cette passe replace donc uniquement Label et Shape après leur création, sans
 * toucher aux plaques/images dont la géométrie est déjà correcte.
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

  await api.updateItems(
    targets.map((item) => item.id),
    (drafts) => {
      for (const draft of drafts) {
        if (draft.type === "LABEL") {
          const width =
            typeof draft.text.width === "number" ? draft.text.width : 0;
          const height =
            typeof draft.text.height === "number" ? draft.text.height : 0;

          draft.position = {
            x: draft.position.x + width / 2,
            y: draft.position.y + height / 2,
          };
          continue;
        }

        if (draft.type === "SHAPE") {
          draft.position = {
            x: draft.position.x - draft.width / 2,
            y: draft.position.y - draft.height / 2,
          };
        }
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
