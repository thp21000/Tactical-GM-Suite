import OBR, { buildImage, type Item } from "@owlbear-rodeo/sdk";
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
  createOrUpdateTokenOverlay as createOrUpdateTokenOverlayV19,
  deleteTokenOverlay,
  findExistingStatsOverlay,
  type StatOverlayObrExistingOverlay,
  type StatOverlayObrManualAction,
  type StatOverlayObrSyncResult,
  type StatOverlayObrSyncStatus,
} from "./statTokenOverlayObrSyncV19";

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
const PLATE_LOGICAL_WIDTH = 320;
const PLATE_LOGICAL_HEIGHT = 96;
const UNIT_LOGICAL_SIZE = 96;
const NEUTRAL_Z_INDEX = -28;
const PLATE_MUTED_ASSET = "assets/stats/stat-plate-muted.svg?v=0.3.60";
const UNIT_MUTED_ASSET = "assets/stats/stat-unit-muted.svg?v=0.3.60";

function getAudienceApi(visibility: StatTrackerVisibility): OverlayMutableApi {
  return visibility === "public" ? OBR.scene.items : OBR.scene.local;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function absoluteAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.href).href;
  } catch {
    return path;
  }
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

function neutralFrame(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  id: string,
  assetPath: string,
  logicalWidth: number,
  logicalHeight: number,
  geometry: ImageGeometry,
  sceneDpi: number,
): Item {
  return buildImage(
    {
      width: logicalWidth,
      height: logicalHeight,
      url: absoluteAssetUrl(assetPath),
      mime: "image/svg+xml",
    },
    {
      dpi: logicalWidth,
      offset: { x: logicalWidth / 2, y: logicalHeight / 2 },
    },
  )
    .id(id)
    .name(`Stats Dock — ${token.name}`)
    .position({
      x: geometry.x + geometry.width / 2,
      y: geometry.y + geometry.height / 2,
    })
    .rotation(0)
    .scale({
      x: geometry.width / sceneDpi,
      y:
        (geometry.height * logicalWidth) /
        (logicalHeight * sceneDpi),
    })
    .layer("ATTACHMENT")
    .attachedTo(sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(metadata, id))
    .build();
}

function activeToggleNeutralBase(
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

  const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;
  return [
    neutralFrame(
      token,
      sourceItemId,
      metadata,
      `${baseId}-neutral-base`,
      PLATE_MUTED_ASSET,
      PLATE_LOGICAL_WIDTH,
      PLATE_LOGICAL_HEIGHT,
      geometry,
      sceneDpi,
    ),
  ];
}

function activeIconNeutralBases(
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
    const frame = itemMap.get(`${baseId}-unit-${index}-frame`);
    if (!frame) continue;

    const geometry = getImageGeometry(
      frame,
      sceneDpi,
      UNIT_LOGICAL_SIZE,
      UNIT_LOGICAL_SIZE,
    );
    if (!geometry) continue;

    result.push(
      neutralFrame(
        token,
        sourceItemId,
        metadata,
        `${baseId}-unit-${index}-neutral-base`,
        UNIT_MUTED_ASSET,
        UNIT_LOGICAL_SIZE,
        UNIT_LOGICAL_SIZE,
        geometry,
        sceneDpi,
      ),
    );
  }

  return result;
}

async function addAudienceNeutralBases(
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
  const neutralBases: Item[] = [];

  for (const item of payload.items) {
    const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;

    if (item.mode === "toggle") {
      const plate = itemMap.get(`${baseId}-plate`);
      if (plate) {
        neutralBases.push(
          ...activeToggleNeutralBase(
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
      neutralBases.push(
        ...activeIconNeutralBases(
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

  if (neutralBases.length === 0) return;

  await api.addItems(neutralBases);
  await api.updateItems(
    neutralBases.map((item) => item.id),
    (drafts) => {
      for (const draft of drafts) {
        draft.layer = "ATTACHMENT";
        draft.zIndex = NEUTRAL_Z_INDEX;
      }
    },
  );
}

async function addNeutralBases(token: StatTrackedToken): Promise<void> {
  if (!token.sourceItemId) return;
  const sceneDpi = await OBR.scene.grid.getDpi();

  for (const visibility of AUDIENCES) {
    await addAudienceNeutralBases(token, visibility, sceneDpi);
  }
}

/**
 * V20 retire la dominante dorée des modes sémantiques actifs sans toucher aux
 * objets Text validés :
 * - valeur simple et barre : base dorée V12/V19 inchangée ;
 * - toggle actif : une plaque neutre/grise est intercalée au-dessus de la base
 *   dorée puis sous les accents colorés V19 ;
 * - toggle inactif : plaque grisée V12 inchangée ;
 * - unité icône active : cadre neutre/gris sous les accents colorés V19 ;
 * - unité icône inactive : cadre grisé V12 inchangé.
 *
 * Empilement : base V12 -30, base neutre V20 -28, lavis V19 -26,
 * liserés V19 -22, icône V17 -10, texte natif inchangé.
 */
export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const result = await createOrUpdateTokenOverlayV19(token);

  if (result.status !== "created" && result.status !== "updated") {
    return result;
  }

  try {
    await addNeutralBases(token);
    return result;
  } catch (error) {
    return {
      ...result,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Erreur Owlbear pendant l'ajout des bases neutres du Stat Dock.",
    };
  }
}
