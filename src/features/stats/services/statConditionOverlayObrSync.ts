import OBR, {
  buildImage,
  isImage,
  type Image,
  type Item,
  type Vector2,
} from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../../../core/constants/ids";
import { isObrReady } from "../../../core/obr/obrReady";
import type {
  StatTokenCondition,
  StatTrackedToken,
  StatTrackerVisibility,
} from "../statTypes";
import { getConditionAssetUrl } from "./statConditionAssets";
import { getTokenDisplayConditions } from "./statConditions";
import type { StatOverlayObrSyncResult } from "./statTokenOverlayObrSync";

export const STAT_CONDITION_OVERLAY_METADATA_KEY = `${EXTENSION_ID}/stats-condition-overlay`;
export const STAT_CONDITION_OVERLAY_KIND = "stats-condition-overlay";

const CONDITION_IMAGE_LOGICAL_SIZE = 1024;
const CONDITION_SIZE_RATIO = 3.65;
const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];

type ConditionOverlayMetadata = {
  kind: typeof STAT_CONDITION_OVERLAY_KIND;
  tokenId: string;
  sourceItemId: string;
  conditionId: string;
  visibility: StatTrackerVisibility;
  updatedAt: string;
};

type OverlayItemsApi = Pick<
  typeof OBR.scene.items,
  "addItems" | "deleteItems" | "getItems" | "updateItems"
>;

type ConditionOverlayGeometry = {
  position: Vector2;
  scale: number;
};

function createResult(
  action: "create-or-update" | "delete",
  status: StatOverlayObrSyncResult["status"],
  message: string,
  token: StatTrackedToken,
): StatOverlayObrSyncResult {
  return {
    action,
    status,
    message,
    sourceItemId: token.sourceItemId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readMetadata(item: Item): ConditionOverlayMetadata | undefined {
  const value = item.metadata?.[STAT_CONDITION_OVERLAY_METADATA_KEY];
  if (!isRecord(value)) return undefined;

  if (
    value.kind !== STAT_CONDITION_OVERLAY_KIND ||
    typeof value.tokenId !== "string" ||
    typeof value.sourceItemId !== "string" ||
    typeof value.conditionId !== "string" ||
    typeof value.updatedAt !== "string" ||
    (value.visibility !== "public" &&
      value.visibility !== "private" &&
      value.visibility !== "gm")
  ) {
    return undefined;
  }

  return {
    kind: STAT_CONDITION_OVERLAY_KIND,
    tokenId: value.tokenId,
    sourceItemId: value.sourceItemId,
    conditionId: value.conditionId,
    visibility: value.visibility,
    updatedAt: value.updatedAt,
  };
}

function getAudienceApi(visibility: StatTrackerVisibility): OverlayItemsApi {
  return visibility === "public" ? OBR.scene.items : OBR.scene.local;
}

function createConditionOverlayId(
  sourceItemId: string,
  visibility: StatTrackerVisibility,
): string {
  return `tactical-gm-stats-condition-${visibility}-${sourceItemId}`;
}

function getDisplayedCondition(token: StatTrackedToken): StatTokenCondition | undefined {
  return getTokenDisplayConditions(token)[0];
}

async function canCurrentPlayerManageOverlays(): Promise<boolean> {
  try {
    return (await OBR.player.getRole()) === "GM";
  } catch {
    return false;
  }
}

function canUseConditionOverlaySync(): boolean {
  return Boolean(
    OBR.isAvailable &&
      isObrReady() &&
      typeof OBR.scene?.items?.getItems === "function" &&
      typeof OBR.scene.items.getItemBounds === "function" &&
      typeof OBR.scene.items.addItems === "function" &&
      typeof OBR.scene.items.updateItems === "function" &&
      typeof OBR.scene.items.deleteItems === "function" &&
      typeof OBR.scene.grid?.getDpi === "function" &&
      typeof OBR.scene.local?.getItems === "function" &&
      typeof OBR.scene.local.addItems === "function" &&
      typeof OBR.scene.local.updateItems === "function" &&
      typeof OBR.scene.local.deleteItems === "function",
  );
}

/**
 * Character tokens are positioned by their logical Owlbear anchor. Their source
 * image can contain transparent margins or decorative artwork, so image bounds
 * are not a reliable representation of the token footprint.
 *
 * A condition ring therefore uses the source item's logical position as its
 * centre and one scene grid cell multiplied by the token's smallest scale as
 * its diameter. This makes a 1x1 token use a 1-cell ring and a resized 2x2
 * token use a 2-cell ring, independently of the source image canvas.
 */
async function getGeometry(sourceItemId: string): Promise<ConditionOverlayGeometry> {
  const [sourceItem] = await OBR.scene.items.getItems([sourceItemId]);
  const sceneDpi = await OBR.scene.grid.getDpi();

  if (sourceItem) {
    const logicalScale = Math.max(
      0.01,
      Math.min(Math.abs(sourceItem.scale.x), Math.abs(sourceItem.scale.y)),
    );

    return {
      position: sourceItem.position,
      scale: logicalScale * CONDITION_SIZE_RATIO,
    };
  }

  const bounds = await OBR.scene.items.getItemBounds([sourceItemId]);
  const targetSize = Math.min(bounds.width, bounds.height);
  return {
    position: bounds.center,
    scale: Math.max(0.01, (targetSize * CONDITION_SIZE_RATIO) / sceneDpi),
  };
}

function matchesOverlay(
  item: Item,
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
): boolean {
  const metadata = readMetadata(item);
  return Boolean(
    metadata &&
      token.sourceItemId &&
      metadata.tokenId === token.id &&
      metadata.sourceItemId === token.sourceItemId &&
      metadata.visibility === visibility,
  );
}

async function findOverlays(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
): Promise<Item[]> {
  if (!token.sourceItemId) return [];
  return getAudienceApi(visibility).getItems((item) =>
    matchesOverlay(item, token, visibility),
  );
}

async function deleteAudienceOverlay(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
): Promise<number> {
  const overlays = await findOverlays(token, visibility);
  if (overlays.length === 0) return 0;
  await getAudienceApi(visibility).deleteItems(overlays.map((item) => item.id));
  return overlays.length;
}

function buildConditionImage(
  token: StatTrackedToken,
  condition: StatTokenCondition,
  assetUrl: string,
  geometry: ConditionOverlayGeometry,
): Image {
  if (!token.sourceItemId) throw new Error("Token Owlbear non lié.");

  const visibility = condition.visibility ?? "public";
  const overlayId = createConditionOverlayId(token.sourceItemId, visibility);
  const metadata: ConditionOverlayMetadata = {
    kind: STAT_CONDITION_OVERLAY_KIND,
    tokenId: token.id,
    sourceItemId: token.sourceItemId,
    conditionId: condition.conditionId,
    visibility,
    updatedAt: condition.updatedAt,
  };

  return buildImage(
    {
      width: CONDITION_IMAGE_LOGICAL_SIZE,
      height: CONDITION_IMAGE_LOGICAL_SIZE,
      url: assetUrl,
      mime: "image/png",
    },
    {
      dpi: CONDITION_IMAGE_LOGICAL_SIZE,
      offset: {
        x: CONDITION_IMAGE_LOGICAL_SIZE / 2,
        y: CONDITION_IMAGE_LOGICAL_SIZE / 2,
      },
    },
  )
    .id(overlayId)
    .name(`Condition — ${condition.label} — ${token.name}`)
    .position(geometry.position)
    .rotation(0)
    .scale({ x: geometry.scale, y: geometry.scale })
    .layer("ATTACHMENT")
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    // POSITION remains inherited so the ring follows movement instantly.
    // SCALE is recalculated explicitly from the logical token footprint.
    .disableAttachmentBehavior(["COPY", "ROTATION", "SCALE"])
    .metadata({
      [STAT_CONDITION_OVERLAY_METADATA_KEY]: metadata,
    })
    .build();
}

async function upsertConditionOverlay(
  token: StatTrackedToken,
  condition: StatTokenCondition,
  assetUrl: string,
  geometry: ConditionOverlayGeometry,
): Promise<"created" | "updated"> {
  const visibility = condition.visibility ?? "public";
  const api = getAudienceApi(visibility);
  const overlays = await findOverlays(token, visibility);
  const [existing, ...duplicates] = overlays;
  const nextImage = buildConditionImage(token, condition, assetUrl, geometry);

  if (duplicates.length > 0) {
    await api.deleteItems(duplicates.map((item) => item.id));
  }

  if (!existing || !isImage(existing)) {
    if (existing) await api.deleteItems([existing.id]);
    await api.addItems([nextImage]);
    return "created";
  }

  await api.updateItems([existing], (items) => {
    const [draft] = items;
    if (!draft || !isImage(draft)) return;

    draft.name = nextImage.name;
    draft.image = nextImage.image;
    draft.grid = nextImage.grid;
    draft.position = nextImage.position;
    draft.rotation = 0;
    draft.scale = nextImage.scale;
    draft.attachedTo = token.sourceItemId;
    draft.layer = "ATTACHMENT";
    draft.locked = true;
    draft.disableHit = true;
    draft.disableAutoZIndex = true;
    draft.disableAttachmentBehavior = ["COPY", "ROTATION", "SCALE"];
    draft.metadata = {
      ...draft.metadata,
      [STAT_CONDITION_OVERLAY_METADATA_KEY]: nextImage.metadata[
        STAT_CONDITION_OVERLAY_METADATA_KEY
      ],
    };
  });

  return "updated";
}

export async function createOrUpdateTokenConditionOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  if (!token.sourceItemId) {
    return createResult("create-or-update", "not-ready", "Token non lié à Owlbear.", token);
  }

  if (!canUseConditionOverlaySync()) {
    return createResult(
      "create-or-update",
      "unavailable",
      "Affichage image de condition indisponible.",
      token,
    );
  }

  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult("create-or-update", "unavailable", "Action réservée au MJ.", token);
  }

  try {
    const condition = getDisplayedCondition(token);

    if (!condition) {
      let deleted = 0;
      for (const visibility of AUDIENCES) {
        deleted += await deleteAudienceOverlay(token, visibility);
      }
      return createResult(
        "create-or-update",
        deleted > 0 ? "updated" : "not-ready",
        deleted > 0 ? "Image de condition retirée." : "Aucune condition affichée sur token.",
        token,
      );
    }

    const assetUrl = getConditionAssetUrl(condition);
    if (!assetUrl) {
      for (const visibility of AUDIENCES) {
        await deleteAudienceOverlay(token, visibility);
      }
      return createResult(
        "create-or-update",
        "not-ready",
        `Image introuvable pour la condition ${condition.label}.`,
        token,
      );
    }

    const desiredVisibility = condition.visibility ?? "public";
    for (const visibility of AUDIENCES) {
      if (visibility !== desiredVisibility) {
        await deleteAudienceOverlay(token, visibility);
      }
    }

    const geometry = await getGeometry(token.sourceItemId);
    const outcome = await upsertConditionOverlay(token, condition, assetUrl, geometry);

    return createResult(
      "create-or-update",
      outcome,
      `${condition.label} affiché en image sur le token.`,
      token,
    );
  } catch (error) {
    return createResult(
      "create-or-update",
      "error",
      error instanceof Error ? error.message : "Erreur pendant l’affichage de la condition.",
      token,
    );
  }
}

export async function deleteTokenConditionOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  if (!token.sourceItemId) {
    return createResult("delete", "not-ready", "Token non lié à Owlbear.", token);
  }

  if (!canUseConditionOverlaySync()) {
    return createResult("delete", "unavailable", "Affichage image indisponible.", token);
  }

  try {
    let deleted = 0;
    for (const visibility of AUDIENCES) {
      deleted += await deleteAudienceOverlay(token, visibility);
    }

    return createResult(
      "delete",
      deleted > 0 ? "deleted" : "not-found",
      deleted > 0 ? "Image de condition supprimée." : "Aucune image de condition trouvée.",
      token,
    );
  } catch (error) {
    return createResult(
      "delete",
      "error",
      error instanceof Error ? error.message : "Erreur pendant la suppression de la condition.",
      token,
    );
  }
}