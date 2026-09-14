import OBR, { buildShape, type Item, type Vector2 } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken, StatTrackerVisibility } from "../statTypes";
import {
  STAT_OVERLAY_KIND,
  STAT_OVERLAY_METADATA_KEY,
  type StatOverlayObrMetadata,
} from "./statTokenOverlayObrAdapter";
import { createOverlayId } from "./statTokenOverlayPlan";
import {
  createTokenSyncPayloadForVisibility,
  type StatTokenSyncItem,
} from "./statTokenSync";
import {
  canUseObrOverlaySync,
  createOrUpdateTokenOverlay as createOrUpdateTokenOverlayV17,
  deleteTokenOverlay,
  findExistingStatsOverlay,
  type StatOverlayObrExistingOverlay,
  type StatOverlayObrManualAction,
  type StatOverlayObrSyncResult,
  type StatOverlayObrSyncStatus,
} from "./statTokenOverlayObrSyncV17";

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
  "getItems" | "addItems" | "updateItems"
>;

type ImageGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const VALUE_ITEM_HEIGHT = 40;
const ICON_UNIT_SIZE = 34;

function getAudienceApi(visibility: StatTrackerVisibility): OverlayMutableApi {
  return visibility === "public" ? OBR.scene.items : OBR.scene.local;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function createMetadata(
  token: StatTrackedToken,
  sourceItemId: string,
  visibility: StatTrackerVisibility,
): StatOverlayObrMetadata {
  return {
    kind: STAT_OVERLAY_KIND,
    tokenId: token.id,
    sourceItemId,
    overlayId: createOverlayId(sourceItemId, visibility),
    updatedAt: token.updatedAt,
    visibility,
  };
}

function elementMetadata(metadata: StatOverlayObrMetadata, element: string) {
  return { [STAT_OVERLAY_METADATA_KEY]: { ...metadata, element } };
}

function getImageGeometry(item: Item, sceneDpi: number): ImageGeometry | undefined {
  if (item.type !== "IMAGE") return undefined;

  const sourceDpi = item.grid.dpi;
  if (!Number.isFinite(sourceDpi) || sourceDpi <= 0) return undefined;

  const width =
    (item.image.width / sourceDpi) * sceneDpi * Math.abs(item.scale.x);
  const height =
    (item.image.height / sourceDpi) * sceneDpi * Math.abs(item.scale.y);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }

  return {
    x: item.position.x - width / 2,
    y: item.position.y - height / 2,
    width,
    height,
  };
}

function accentShape(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  id: string,
  position: Vector2,
  width: number,
  height: number,
  color: string,
  fillOpacity: number,
  strokeOpacity = 0,
  strokeWidth = 0,
): Item {
  return buildShape()
    .id(id)
    .name(`Stats Dock — ${token.name}`)
    .width(Math.max(1, width))
    .height(Math.max(1, height))
    .shapeType("RECTANGLE")
    .fillColor(color)
    .fillOpacity(fillOpacity)
    .strokeColor(color)
    .strokeOpacity(strokeOpacity)
    .strokeWidth(strokeWidth)
    .position(position)
    .rotation(0)
    .layer("ATTACHMENT")
    .attachedTo(sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(metadata, id))
    .build();
}

function activeToggleAccents(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  item: StatTokenSyncItem,
  plate: Item,
  sceneDpi: number,
): Item[] {
  if (item.mode !== "toggle" || item.enabled !== true) return [];

  const geometry = getImageGeometry(plate, sceneDpi);
  if (!geometry) return [];

  const scale = geometry.height / VALUE_ITEM_HEIGHT;
  const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;
  const insetX = 7 * scale;
  const insetY = 6 * scale;
  const bodyWidth = Math.max(1, geometry.width - insetX * 2);
  const bodyHeight = Math.max(1, geometry.height - insetY * 2);
  const lineInset = 15 * scale;
  const lineWidth = Math.max(1, geometry.width - lineInset * 2);

  return [
    accentShape(
      token,
      sourceItemId,
      metadata,
      `${baseId}-toggle-accent-body`,
      { x: geometry.x + insetX, y: geometry.y + insetY },
      bodyWidth,
      bodyHeight,
      item.accentColor,
      0.08,
      0.32,
      Math.max(0.8, 1.05 * scale),
    ),
    accentShape(
      token,
      sourceItemId,
      metadata,
      `${baseId}-toggle-accent-highlight`,
      { x: geometry.x + lineInset, y: geometry.y + 4.5 * scale },
      lineWidth,
      Math.max(1, 1.45 * scale),
      item.accentColor,
      0.72,
    ),
  ];
}

function activeIconUnitAccents(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  item: StatTokenSyncItem,
  itemMap: Map<string, Item>,
  sceneDpi: number,
): Item[] {
  if (item.mode !== "icon") return [];

  const max = Math.min(6, Math.max(1, Math.round(item.max ?? 1)));
  const current = Math.min(max, Math.max(0, Math.round(item.current ?? 0)));
  const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;
  const result: Item[] = [];

  for (let index = 0; index < current; index += 1) {
    const frameId = `${baseId}-unit-${index}-frame`;
    const frame = itemMap.get(frameId);
    if (!frame) continue;

    const geometry = getImageGeometry(frame, sceneDpi);
    if (!geometry) continue;

    const scale = geometry.height / ICON_UNIT_SIZE;
    const inset = 4.5 * scale;
    const accentId = `${baseId}-unit-${index}-accent`;

    result.push(
      accentShape(
        token,
        sourceItemId,
        metadata,
        accentId,
        { x: geometry.x + inset, y: geometry.y + inset },
        Math.max(1, geometry.width - inset * 2),
        Math.max(1, geometry.height - inset * 2),
        item.accentColor,
        0.1,
        0.42,
        Math.max(0.8, 1.05 * scale),
      ),
    );
  }

  return result;
}

async function addAudienceAccents(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
  sceneDpi: number,
): Promise<void> {
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return;

  const payload = createTokenSyncPayloadForVisibility(token, visibility);
  if (payload.status !== "ready") return;

  const api = getAudienceApi(visibility);
  const metadata = createMetadata(token, sourceItemId, visibility);
  const existing = await api.getItems();
  const itemMap = new Map(existing.map((item) => [item.id, item]));
  const accents: Item[] = [];

  for (const item of payload.items) {
    const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;

    if (item.mode === "toggle") {
      const plate = itemMap.get(`${baseId}-plate`);
      if (plate) {
        accents.push(
          ...activeToggleAccents(
            token,
            sourceItemId,
            metadata,
            item,
            plate,
            sceneDpi,
          ),
        );
      }
      continue;
    }

    if (item.mode === "icon") {
      accents.push(
        ...activeIconUnitAccents(
          token,
          sourceItemId,
          metadata,
          item,
          itemMap,
          sceneDpi,
        ),
      );
    }
  }

  if (accents.length === 0) return;

  await api.addItems(accents);
  const accentIds = accents.map((item) => item.id);
  await api.updateItems(accentIds, (drafts) => {
    for (const draft of drafts) {
      draft.layer = "ATTACHMENT";
      draft.zIndex = -24;
    }
  });
}

async function addSemanticAccents(token: StatTrackedToken): Promise<void> {
  if (!token.sourceItemId) return;
  const sceneDpi = await OBR.scene.grid.getDpi();

  for (const visibility of AUDIENCES) {
    await addAudienceAccents(token, visibility, sceneDpi);
  }
}

/**
 * V18 conserve la géométrie et les objets Text validés en V17/V12, puis ajoute
 * uniquement des formes graphiques derrière le texte :
 * - toggle actif : teinte + liseré de la couleur d'accent ;
 * - toggle inactif : rendu V12 grisé inchangé ;
 * - unités icône actives : halo/liseré coloré ;
 * - unités inactives : rendu V12 grisé inchangé.
 *
 * Les modes valeur simple et barre à maximum gardent le liseré métallique doré
 * de la maquette. Cette couche ne mute jamais les objets Text de scène.
 */
export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const result = await createOrUpdateTokenOverlayV17(token);

  if (result.status !== "created" && result.status !== "updated") {
    return result;
  }

  try {
    await addSemanticAccents(token);
    return result;
  } catch (error) {
    return {
      ...result,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Erreur Owlbear pendant l'ajout des accents du Stat Dock.",
    };
  }
}
