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

  // IMPORTANT : ne jamais muter un objet TEXT après sa création.
  // Les tests en room montrent que V12 affiche correctement ses Text de scène
  // tant qu'ils restent exactement tels que le builder les a créés. Les
  // changements de layer ou de zIndex appliqués après addItems les font
  // disparaître. Les Text restent donc à leur zIndex natif (0), et tous les
  // éléments graphiques sont simplement placés derrière eux.
  if (item.type === "TEXT") return undefined;

  if (item.type === "SHAPE") {
    if (element.endsWith("-mute")) return { zIndex: -5 };
    return { zIndex: -20 };
  }

  if (item.type === "IMAGE") {
    if (element.endsWith("-icon")) return { zIndex: -10 };
    return { zIndex: -30 };
  }

  return undefined;
}

async function orderDockGraphics(
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
      // Tous les éléments restent sur ATTACHMENT. Seuls les éléments non-TEXT
      // sont ordonnés derrière le texte de scène natif.
      draft.layer = "ATTACHMENT";
      draft.zIndex = presentation.zIndex;
    }
  });
}

/**
 * V17.1 conserve intégralement la géométrie V12 et ses vrais objets Text de
 * scène. Aucun Label screen-space n'est utilisé et, surtout, aucun Text n'est
 * modifié après sa création. L'empilement est obtenu en envoyant uniquement les
 * plaques, formes et icônes derrière le zIndex natif du texte.
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
      orderDockGraphics(OBR.scene.items, sourceItemId),
      orderDockGraphics(OBR.scene.local, sourceItemId),
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
