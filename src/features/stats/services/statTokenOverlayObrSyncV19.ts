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

type AccentPresentation = {
  zIndex: number;
};

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const VALUE_ITEM_HEIGHT = 40;
const ICON_UNIT_SIZE = 34;
const PLATE_LOGICAL_WIDTH = 320;
const PLATE_LOGICAL_HEIGHT = 96;
const UNIT_LOGICAL_SIZE = 96;

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

function getImageGeometry(
  item: Item,
  sceneDpi: number,
  logicalWidth: number,
  logicalHeight: number,
): ImageGeometry | undefined {
  if (item.type !== "IMAGE") return undefined;
  if (
    !Number.isFinite(sceneDpi) ||
    sceneDpi <= 0 ||
    !Number.isFinite(logicalWidth) ||
    logicalWidth <= 0 ||
    !Number.isFinite(logicalHeight) ||
    logicalHeight <= 0
  ) {
    return undefined;
  }

  const width = sceneDpi * Math.abs(item.scale.x);
  const height =
    sceneDpi * Math.abs(item.scale.y) * (logicalHeight / logicalWidth);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
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

function toggleAccents(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  item: StatTokenSyncItem,
  plate: Item,
  sceneDpi: number,
): Item[] {
  if (item.mode !== "toggle" || item.enabled !== true) return [];

  const geometry = getImageGeometry(
    plate,
    sceneDpi,
    PLATE_LOGICAL_WIDTH,
    PLATE_LOGICAL_HEIGHT,
  );
  if (!geometry) return [];

  const scale = geometry.height / VALUE_ITEM_HEIGHT;
  const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;
  const washInsetX = 5.5 * scale;
  const washInsetY = 5 * scale;
  const edgeInsetX = 11 * scale;
  const edgeInsetY = 7.5 * scale;
  const edgeThickness = Math.max(1, 1.8 * scale);

  return [
    // Lavis coloré : suffisamment présent pour que le toggle actif soit
    // immédiatement identifié, sans masquer le fond métallique.
    accentShape(
      token,
      sourceItemId,
      metadata,
      `${baseId}-toggle-accent-wash`,
      { x: geometry.x + washInsetX, y: geometry.y + washInsetY },
      Math.max(1, geometry.width - washInsetX * 2),
      Math.max(1, geometry.height - washInsetY * 2),
      item.accentColor,
      0.16,
      0.68,
      Math.max(1, 1.35 * scale),
    ),
    // Trait supérieur très lumineux : c'est lui qui remplace visuellement la
    // dominante dorée par la couleur propre au tracker.
    accentShape(
      token,
      sourceItemId,
      metadata,
      `${baseId}-toggle-accent-edge-top`,
      { x: geometry.x + edgeInsetX, y: geometry.y + 4.2 * scale },
      Math.max(1, geometry.width - edgeInsetX * 2),
      Math.max(1, 2.15 * scale),
      item.accentColor,
      0.96,
    ),
    accentShape(
      token,
      sourceItemId,
      metadata,
      `${baseId}-toggle-accent-edge-bottom`,
      {
        x: geometry.x + edgeInsetX,
        y: geometry.y + geometry.height - 6.1 * scale,
      },
      Math.max(1, geometry.width - edgeInsetX * 2),
      Math.max(1, 1.55 * scale),
      item.accentColor,
      0.68,
    ),
    accentShape(
      token,
      sourceItemId,
      metadata,
      `${baseId}-toggle-accent-edge-left`,
      { x: geometry.x + 4.1 * scale, y: geometry.y + edgeInsetY },
      edgeThickness,
      Math.max(1, geometry.height - edgeInsetY * 2),
      item.accentColor,
      0.82,
    ),
    accentShape(
      token,
      sourceItemId,
      metadata,
      `${baseId}-toggle-accent-edge-right`,
      {
        x: geometry.x + geometry.width - 5.9 * scale,
        y: geometry.y + edgeInsetY,
      },
      edgeThickness,
      Math.max(1, geometry.height - edgeInsetY * 2),
      item.accentColor,
      0.82,
    ),
  ];
}

function iconUnitAccents(
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

    const geometry = getImageGeometry(
      frame,
      sceneDpi,
      UNIT_LOGICAL_SIZE,
      UNIT_LOGICAL_SIZE,
    );
    if (!geometry) continue;

    const scale = geometry.height / ICON_UNIT_SIZE;
    const unitBaseId = `${baseId}-unit-${index}`;
    const washInset = 3.6 * scale;
    const edgeInset = 6.4 * scale;
    const edgeThickness = Math.max(1, 1.55 * scale);

    result.push(
      accentShape(
        token,
        sourceItemId,
        metadata,
        `${unitBaseId}-accent-wash`,
        { x: geometry.x + washInset, y: geometry.y + washInset },
        Math.max(1, geometry.width - washInset * 2),
        Math.max(1, geometry.height - washInset * 2),
        item.accentColor,
        0.18,
        0.78,
        Math.max(1, 1.25 * scale),
      ),
      accentShape(
        token,
        sourceItemId,
        metadata,
        `${unitBaseId}-accent-edge-top`,
        { x: geometry.x + edgeInset, y: geometry.y + 2.7 * scale },
        Math.max(1, geometry.width - edgeInset * 2),
        edgeThickness,
        item.accentColor,
        0.98,
      ),
      accentShape(
        token,
        sourceItemId,
        metadata,
        `${unitBaseId}-accent-edge-bottom`,
        {
          x: geometry.x + edgeInset,
          y: geometry.y + geometry.height - 4.2 * scale,
        },
        Math.max(1, geometry.width - edgeInset * 2),
        edgeThickness,
        item.accentColor,
        0.74,
      ),
      accentShape(
        token,
        sourceItemId,
        metadata,
        `${unitBaseId}-accent-edge-left`,
        { x: geometry.x + 2.7 * scale, y: geometry.y + edgeInset },
        edgeThickness,
        Math.max(1, geometry.height - edgeInset * 2),
        item.accentColor,
        0.9,
      ),
      accentShape(
        token,
        sourceItemId,
        metadata,
        `${unitBaseId}-accent-edge-right`,
        {
          x: geometry.x + geometry.width - 4.2 * scale,
          y: geometry.y + edgeInset,
        },
        edgeThickness,
        Math.max(1, geometry.height - edgeInset * 2),
        item.accentColor,
        0.9,
      ),
    );
  }

  return result;
}

function accentPresentation(item: Item): AccentPresentation {
  const metadata = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  const element =
    typeof metadata === "object" && metadata !== null && "element" in metadata
      ? (metadata as { element?: unknown }).element
      : undefined;

  if (typeof element === "string") {
    if (element.endsWith("-accent-wash")) return { zIndex: -26 };
    if (element.includes("-accent-edge-")) return { zIndex: -22 };
  }
  return { zIndex: -24 };
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
          ...toggleAccents(
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
        ...iconUnitAccents(
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
  const presentations = new Map(
    accents.map((item) => [item.id, accentPresentation(item)]),
  );

  await api.updateItems([...presentations.keys()], (drafts) => {
    for (const draft of drafts) {
      const presentation = presentations.get(draft.id);
      if (!presentation) continue;
      draft.layer = "ATTACHMENT";
      draft.zIndex = presentation.zIndex;
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
 * V19 renforce la différenciation visuelle demandée par la maquette :
 * - valeur simple et barre : cadre métallique doré V12 inchangé ;
 * - toggle actif : lavis + liseré intérieur dans la couleur d'accent ;
 * - toggle inactif : plaque grisée V12 inchangée ;
 * - unités icône actives : cadre intérieur clairement coloré ;
 * - unités inactives : plaque grisée V12 inchangée.
 *
 * Les accents restent entre les plaques (zIndex -30) et les icônes (zIndex -10)
 * et aucun objet Text n'est modifié après sa création.
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
          : "Erreur Owlbear pendant l'ajout des accents colorés du Stat Dock.",
    };
  }
}
