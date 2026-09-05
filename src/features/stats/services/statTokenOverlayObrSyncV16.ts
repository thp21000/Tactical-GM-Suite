import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import { STAT_OVERLAY_METADATA_KEY } from "./statTokenOverlayObrAdapter";
import {
  canUseObrOverlaySync,
  createOrUpdateTokenOverlay as createOrUpdateTokenOverlayV12,
  deleteTokenOverlay,
  findExistingStatsOverlay,
  type StatOverlayObrExistingOverlay,
  type StatOverlayObrManualAction,
  type StatOverlayObrSyncResult,
  type StatOverlayObrSyncStatus,
} from "./statTokenOverlayObrSyncV12";

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

type OverlayMutableApi = Pick<typeof OBR.scene.items, "getItems" | "updateItems">;
type DockLayer = "ATTACHMENT" | "NOTE" | "TEXT";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getDockElement(item: Item, sourceItemId: string): string | undefined {
  const metadata = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  if (!isRecord(metadata) || metadata.sourceItemId !== sourceItemId) return undefined;
  return typeof metadata.element === "string" ? metadata.element : undefined;
}

function getDesiredLayer(item: Item, sourceItemId: string): DockLayer | undefined {
  const element = getDockElement(item, sourceItemId);
  if (!element) return undefined;

  // V12 est la dernière base qui a réellement validé le comportement de zoom :
  // ses Text/Shape vivent en espace scène. On ne change donc ni leurs
  // coordonnées ni leur taille, seulement leur layer pour garantir l'empilement.
  if (item.type === "TEXT") return "TEXT";
  if (item.type === "SHAPE") return "NOTE";

  if (item.type === "IMAGE") {
    // Les PNG d'icône doivent être au-dessus des plaques SVG. Les frames de
    // plaque/unité restent en ATTACHMENT.
    return element.endsWith("-icon") ? "NOTE" : "ATTACHMENT";
  }

  return undefined;
}

async function separateDockLayers(
  api: OverlayMutableApi,
  sourceItemId: string,
): Promise<void> {
  const items = await api.getItems();
  const desiredLayers = new Map<string, DockLayer>();

  for (const item of items) {
    const layer = getDesiredLayer(item, sourceItemId);
    if (layer) desiredLayers.set(item.id, layer);
  }

  if (desiredLayers.size === 0) return;

  await api.updateItems([...desiredLayers.keys()], (drafts) => {
    for (const draft of drafts) {
      const layer = desiredLayers.get(draft.id);
      if (layer) draft.layer = layer;
    }
  });
}

/**
 * V16 combine les deux comportements validés séparément en room :
 * - V12 : Text + Shape en espace scène, donc proportions stables au zoom ;
 * - V14 : séparation physique des layers pour empêcher les plaques de masquer
 *   les icônes, barres ou textes.
 *
 * Aucun Label screen-space n'est utilisé ici.
 */
export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const result = await createOrUpdateTokenOverlayV12(token);
  const sourceItemId = token.sourceItemId;

  if (
    !sourceItemId ||
    (result.status !== "created" && result.status !== "updated")
  ) {
    return result;
  }

  try {
    await Promise.all([
      separateDockLayers(OBR.scene.items, sourceItemId),
      separateDockLayers(OBR.scene.local, sourceItemId),
    ]);
    return result;
  } catch (error) {
    return {
      ...result,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Erreur Owlbear pendant la séparation des layers du Stat Dock.",
    };
  }
}
