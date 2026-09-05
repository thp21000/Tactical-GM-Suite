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

type DockPresentation = {
  zIndex: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getDockElement(item: Item, sourceItemId: string): string | undefined {
  const metadata = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  if (!isRecord(metadata) || metadata.sourceItemId !== sourceItemId) return undefined;
  return typeof metadata.element === "string" ? metadata.element : undefined;
}

function getPresentation(item: Item, sourceItemId: string): DockPresentation | undefined {
  const element = getDockElement(item, sourceItemId);
  if (!element) return undefined;

  // Tout reste volontairement sur ATTACHMENT : c'est la configuration V12
  // qui a réellement validé le texte en espace scène et le comportement au zoom.
  // On ne règle ici que l'ordre interne au layer.
  if (item.type === "TEXT") return { zIndex: 40 };

  if (item.type === "SHAPE") {
    if (element.endsWith("-mute")) return { zIndex: 50 };
    return { zIndex: 20 };
  }

  if (item.type === "IMAGE") {
    if (element.endsWith("-icon")) return { zIndex: 30 };
    return { zIndex: 10 };
  }

  return undefined;
}

async function orderDockElements(
  api: OverlayMutableApi,
  sourceItemId: string,
): Promise<void> {
  const items = await api.getItems();
  const presentations = new Map<string, DockPresentation>();

  for (const item of items) {
    const presentation = getPresentation(item, sourceItemId);
    if (presentation) presentations.set(item.id, presentation);
  }

  if (presentations.size === 0) return;

  await api.updateItems([...presentations.keys()], (drafts) => {
    for (const draft of drafts) {
      const presentation = presentations.get(draft.id);
      if (!presentation) continue;
      draft.layer = "ATTACHMENT";
      draft.zIndex = presentation.zIndex;
    }
  });
}

/**
 * V17 conserve intégralement la géométrie V12, y compris ses vrais objets Text
 * de scène. Aucun Label screen-space et aucun changement de layer n'est utilisé.
 * L'empilement est seulement rendu déterministe via zIndex dans ATTACHMENT.
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
      orderDockElements(OBR.scene.items, sourceItemId),
      orderDockElements(OBR.scene.local, sourceItemId),
    ]);
    return result;
  } catch (error) {
    return {
      ...result,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Erreur Owlbear pendant l'ordonnancement du Stat Dock.",
    };
  }
}
