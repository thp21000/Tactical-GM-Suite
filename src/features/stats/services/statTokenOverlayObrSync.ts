import OBR, {
  buildImage,
  isImage,
  type BoundingBox,
  type Image,
  type Item,
  type Vector2,
} from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import type {
  StatTrackedToken,
  StatTrackerVisibility,
} from "../statTypes";
import {
  prepareOverlayImageForObr,
  STAT_OVERLAY_KIND,
  STAT_OVERLAY_METADATA_KEY,
  type StatOverlayObrMetadata,
  type StatOverlayObrPreparedImage,
  type StatOverlayObrPrepareResult,
} from "./statTokenOverlayObrAdapter";

export type StatOverlayObrManualAction = "create-or-update" | "delete";

export type StatOverlayObrSyncStatus =
  | "created"
  | "updated"
  | "deleted"
  | "not-found"
  | "not-ready"
  | "unavailable"
  | "error";

export type StatOverlayObrSyncResult = {
  status: StatOverlayObrSyncStatus;
  action: StatOverlayObrManualAction;
  message: string;
  overlayId?: string;
  sourceItemId?: string;
};

export type StatOverlayObrExistingOverlay = {
  item: Item;
  metadata: StatOverlayObrMetadata;
};

type OverlayItemsApi = Pick<
  typeof OBR.scene.items,
  "addItems" | "deleteItems" | "getItems" | "updateItems"
>;

type PreparedAudience = {
  visibility: StatTrackerVisibility;
  result: StatOverlayObrPrepareResult;
};

const DEFAULT_OVERLAY_DPI = 96;
const OVERLAY_GAP = 12;
const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];

function createResult(
  action: StatOverlayObrManualAction,
  status: StatOverlayObrSyncStatus,
  message: string,
  details?: Pick<StatOverlayObrSyncResult, "overlayId" | "sourceItemId">,
): StatOverlayObrSyncResult {
  return { action, status, message, ...details };
}

function isVisibility(value: unknown): value is StatTrackerVisibility {
  return value === "public" || value === "private" || value === "gm";
}

function readOverlayMetadata(item: Item): StatOverlayObrMetadata | undefined {
  const value = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  if (!value || typeof value !== "object") return undefined;

  const metadata = value as Partial<StatOverlayObrMetadata>;
  if (
    metadata.kind !== STAT_OVERLAY_KIND ||
    typeof metadata.tokenId !== "string" ||
    typeof metadata.sourceItemId !== "string" ||
    typeof metadata.overlayId !== "string" ||
    typeof metadata.updatedAt !== "string"
  ) {
    return undefined;
  }

  return {
    kind: STAT_OVERLAY_KIND,
    tokenId: metadata.tokenId,
    sourceItemId: metadata.sourceItemId,
    overlayId: metadata.overlayId,
    updatedAt: metadata.updatedAt,
    // V2.5F legacy overlays had no audience and are treated as public so that
    // the next manual update replaces their potentially mixed SVG safely.
    visibility: isVisibility(metadata.visibility) ? metadata.visibility : "public",
  };
}

function matchesTokenOverlay(
  item: Item,
  token: StatTrackedToken,
  visibility?: StatTrackerVisibility,
): boolean {
  const metadata = readOverlayMetadata(item);
  return Boolean(
    metadata &&
      token.sourceItemId &&
      metadata.tokenId === token.id &&
      metadata.sourceItemId === token.sourceItemId &&
      (!visibility || metadata.visibility === visibility),
  );
}

function getOverlayImageContent(preparedImage: StatOverlayObrPreparedImage) {
  return {
    width: preparedImage.width,
    height: preparedImage.height,
    mime: "image/svg+xml",
    url: preparedImage.svgDataUrl,
  };
}

function getOverlayImageGrid() {
  return {
    dpi: DEFAULT_OVERLAY_DPI,
    offset: { x: 0, y: 0 },
  };
}

function getAudienceApi(visibility: StatTrackerVisibility): OverlayItemsApi {
  return visibility === "public" ? OBR.scene.items : OBR.scene.local;
}

async function canCurrentPlayerManageOverlays(): Promise<boolean> {
  try {
    return (await OBR.player.getRole()) === "GM";
  } catch {
    return false;
  }
}

function getPreparedAudiences(token: StatTrackedToken): PreparedAudience[] {
  return AUDIENCES.map((visibility) => ({
    visibility,
    result: prepareOverlayImageForObr(token, visibility),
  }));
}

function getAudiencePositions(
  bounds: BoundingBox,
  audiences: PreparedAudience[],
): Map<StatTrackerVisibility, Vector2> {
  const positions = new Map<StatTrackerVisibility, Vector2>();
  let stackedHeight = 0;

  for (const audience of audiences) {
    const image = audience.result.preparedImage;
    if (!image) continue;

    positions.set(audience.visibility, {
      x: bounds.center.x,
      y: bounds.min.y - OVERLAY_GAP - stackedHeight - image.height / 2,
    });
    stackedHeight += image.height + OVERLAY_GAP;
  }

  return positions;
}

function buildOverlayImage(
  preparedImage: StatOverlayObrPreparedImage,
  position: Vector2,
): Image {
  return buildImage(getOverlayImageContent(preparedImage), getOverlayImageGrid())
    .id(preparedImage.overlayId)
    .name(`Stats Overlay ${preparedImage.visibility} — ${preparedImage.tokenName}`)
    .position(position)
    .layer("ATTACHMENT")
    .attachedTo(preparedImage.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY"])
    .metadata({
      [STAT_OVERLAY_METADATA_KEY]: preparedImage.metadata,
    })
    .build();
}

async function findOverlays(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
): Promise<StatOverlayObrExistingOverlay[]> {
  if (!token.sourceItemId) return [];

  const items = await getAudienceApi(visibility).getItems();
  return items.flatMap((item) => {
    if (!matchesTokenOverlay(item, token, visibility)) return [];
    const metadata = readOverlayMetadata(item);
    return metadata ? [{ item, metadata }] : [];
  });
}

export function canUseObrOverlaySync(): boolean {
  return Boolean(
    OBR.isAvailable &&
      isObrReady() &&
      typeof OBR.scene?.items?.getItems === "function" &&
      typeof OBR.scene.items.addItems === "function" &&
      typeof OBR.scene.items.updateItems === "function" &&
      typeof OBR.scene.items.deleteItems === "function" &&
      typeof OBR.scene.local?.getItems === "function" &&
      typeof OBR.scene.local.addItems === "function" &&
      typeof OBR.scene.local.updateItems === "function" &&
      typeof OBR.scene.local.deleteItems === "function",
  );
}

export async function findExistingStatsOverlay(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility = "public",
): Promise<StatOverlayObrExistingOverlay | undefined> {
  if (!canUseObrOverlaySync()) return undefined;
  return (await findOverlays(token, visibility))[0];
}

async function deleteAudienceOverlays(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
): Promise<number> {
  const overlays = await findOverlays(token, visibility);
  if (overlays.length === 0) return 0;

  await getAudienceApi(visibility).deleteItems(overlays.map(({ item }) => item.id));
  return overlays.length;
}

async function upsertAudienceOverlay(
  token: StatTrackedToken,
  preparedImage: StatOverlayObrPreparedImage,
  position: Vector2,
): Promise<"created" | "updated"> {
  const api = getAudienceApi(preparedImage.visibility);
  const overlays = await findOverlays(token, preparedImage.visibility);
  const [existing, ...duplicates] = overlays;

  if (duplicates.length > 0) {
    await api.deleteItems(duplicates.map(({ item }) => item.id));
  }

  if (!existing || !isImage(existing.item)) {
    if (existing) await api.deleteItems([existing.item.id]);
    await api.addItems([buildOverlayImage(preparedImage, position)]);
    return "created";
  }

  await api.updateItems([existing.item], (items) => {
    const [draft] = items;
    if (!draft || !isImage(draft)) return;

    draft.name = `Stats Overlay ${preparedImage.visibility} — ${preparedImage.tokenName}`;
    draft.position = position;
    draft.attachedTo = preparedImage.sourceItemId;
    draft.layer = "ATTACHMENT";
    draft.locked = true;
    draft.disableHit = true;
    draft.disableAutoZIndex = true;
    draft.disableAttachmentBehavior = ["COPY"];
    draft.image = getOverlayImageContent(preparedImage);
    draft.grid = getOverlayImageGrid();
    draft.metadata = {
      ...draft.metadata,
      [STAT_OVERLAY_METADATA_KEY]: preparedImage.metadata,
    };
  });

  return "updated";
}

export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "create-or-update";

  if (!token.sourceItemId) {
    return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
  }

  if (!canUseObrOverlaySync()) {
    return createResult(action, "unavailable", "Owlbear indisponible ou scène non prête.", {
      sourceItemId: token.sourceItemId,
    });
  }

  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult(action, "unavailable", "Action réservée au MJ.", {
      sourceItemId: token.sourceItemId,
    });
  }

  const audiences = getPreparedAudiences(token);
  if (audiences.some(({ result }) => result.status === "invalid")) {
    return createResult(action, "not-ready", "Un rendu d'audience est invalide.", {
      sourceItemId: token.sourceItemId,
    });
  }

  try {
    const bounds = await OBR.scene.items.getItemBounds([token.sourceItemId]);
    const positions = getAudiencePositions(bounds, audiences);
    let createdCount = 0;
    let updatedCount = 0;
    let removedCount = 0;

    for (const audience of audiences) {
      const image = audience.result.preparedImage;
      const position = positions.get(audience.visibility);

      if (!image || !position) {
        removedCount += await deleteAudienceOverlays(token, audience.visibility);
        continue;
      }

      const outcome = await upsertAudienceOverlay(token, image, position);
      if (outcome === "created") createdCount += 1;
      else updatedCount += 1;
    }

    const counts = Object.fromEntries(
      audiences.map(({ visibility, result }) => [
        visibility,
        result.preparedImage?.itemCount ?? 0,
      ]),
    ) as Record<StatTrackerVisibility, number>;
    const message = `Public ${counts.public} · Privé ${counts.private} · MJ ${counts.gm}`;

    if (createdCount > 0) {
      return createResult(action, "created", `Affichage token créé · ${message}`, {
        sourceItemId: token.sourceItemId,
      });
    }

    if (updatedCount > 0 || removedCount > 0) {
      return createResult(action, "updated", `Affichage token mis à jour · ${message}`, {
        sourceItemId: token.sourceItemId,
      });
    }

    return createResult(action, "not-ready", "Aucun item activé pour affichage token.", {
      sourceItemId: token.sourceItemId,
    });
  } catch (error) {
    return createResult(
      action,
      "error",
      error instanceof Error ? error.message : "Erreur Owlbear pendant la mise à jour.",
      { sourceItemId: token.sourceItemId },
    );
  }
}

export async function deleteTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "delete";

  if (!token.sourceItemId) {
    return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
  }

  if (!canUseObrOverlaySync()) {
    return createResult(action, "unavailable", "Owlbear indisponible ou scène non prête.", {
      sourceItemId: token.sourceItemId,
    });
  }

  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult(action, "unavailable", "Action réservée au MJ.", {
      sourceItemId: token.sourceItemId,
    });
  }

  try {
    let deletedCount = 0;
    for (const visibility of AUDIENCES) {
      deletedCount += await deleteAudienceOverlays(token, visibility);
    }

    if (deletedCount === 0) {
      return createResult(action, "not-found", "Aucun overlay Stats trouvé pour ce token.", {
        sourceItemId: token.sourceItemId,
      });
    }

    return createResult(
      action,
      "deleted",
      `${deletedCount} overlay${deletedCount > 1 ? "s" : ""} Stats supprimé${deletedCount > 1 ? "s" : ""}.`,
      { sourceItemId: token.sourceItemId },
    );
  } catch (error) {
    return createResult(
      action,
      "error",
      error instanceof Error ? error.message : "Erreur Owlbear pendant la suppression.",
      { sourceItemId: token.sourceItemId },
    );
  }
}
