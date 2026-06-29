import OBR, { buildImage, isImage, type Image, type Item, type Vector2 } from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import type { StatTrackedToken } from "../statTypes";
import {
  prepareOverlayImageForObr,
  STAT_OVERLAY_KIND,
  STAT_OVERLAY_METADATA_KEY,
  type StatOverlayObrMetadata,
  type StatOverlayObrPreparedImage,
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

const DEFAULT_OVERLAY_DPI = 96;
const OVERLAY_VERTICAL_OFFSET = 12;

function createResult(
  action: StatOverlayObrManualAction,
  status: StatOverlayObrSyncStatus,
  message: string,
  details?: Pick<StatOverlayObrSyncResult, "overlayId" | "sourceItemId">,
): StatOverlayObrSyncResult {
  return { action, status, message, ...details };
}

function isMetadata(value: unknown): value is StatOverlayObrMetadata {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Partial<StatOverlayObrMetadata>;
  return (
    metadata.kind === STAT_OVERLAY_KIND &&
    typeof metadata.tokenId === "string" &&
    typeof metadata.sourceItemId === "string" &&
    typeof metadata.overlayId === "string" &&
    typeof metadata.updatedAt === "string"
  );
}

function getOverlayMetadata(item: Item): StatOverlayObrMetadata | undefined {
  const value = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  return isMetadata(value) ? value : undefined;
}

function matchesTokenOverlay(item: Item, token: StatTrackedToken): boolean {
  const metadata = getOverlayMetadata(item);
  return Boolean(
    metadata &&
      token.sourceItemId &&
      metadata.tokenId === token.id &&
      metadata.sourceItemId === token.sourceItemId,
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

async function canCurrentPlayerManageOverlays(): Promise<boolean> {
  try {
    return (await OBR.player.getRole()) === "GM";
  } catch {
    return true;
  }
}

async function getOverlayPosition(preparedImage: StatOverlayObrPreparedImage): Promise<Vector2> {
  try {
    const bounds = await OBR.scene.items.getItemBounds([preparedImage.sourceItemId]);
    if (!bounds) return { x: 0, y: 0 };

    return {
      x: bounds.min.x,
      y: bounds.min.y - preparedImage.height - OVERLAY_VERTICAL_OFFSET,
    };
  } catch {
    return { x: 0, y: 0 };
  }
}

function buildOverlayImage(
  preparedImage: StatOverlayObrPreparedImage,
  position: Vector2,
): Image {
  return buildImage(getOverlayImageContent(preparedImage), getOverlayImageGrid())
    .id(preparedImage.overlayId)
    .name(`Stats Overlay — ${preparedImage.tokenName}`)
    .position(position)
    .layer("PROP")
    .disableHit(true)
    .disableAutoZIndex(true)
    .metadata({
      [STAT_OVERLAY_METADATA_KEY]: preparedImage.metadata,
    })
    .build();
}

export function canUseObrOverlaySync(): boolean {
  return Boolean(
    OBR.isAvailable &&
      isObrReady() &&
      typeof OBR.scene?.items?.getItems === "function" &&
      typeof OBR.scene.items.addItems === "function" &&
      typeof OBR.scene.items.updateItems === "function" &&
      typeof OBR.scene.items.deleteItems === "function",
  );
}

export async function findExistingStatsOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrExistingOverlay | undefined> {
  if (!canUseObrOverlaySync() || !token.sourceItemId) return undefined;

  const items = await OBR.scene.items.getItems();
  const item = items.find((candidate) => matchesTokenOverlay(candidate, token));
  const metadata = item ? getOverlayMetadata(item) : undefined;

  return item && metadata ? { item, metadata } : undefined;
}

export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "create-or-update";
  const prepared = prepareOverlayImageForObr(token);

  if (prepared.status !== "ready" || !prepared.preparedImage) {
    return createResult(
      action,
      "not-ready",
      prepared.reason ?? "Overlay Stats non prêt pour ce token.",
      { sourceItemId: token.sourceItemId },
    );
  }

  const preparedImage = prepared.preparedImage;

  if (!canUseObrOverlaySync()) {
    return createResult(action, "unavailable", "Owlbear indisponible ou scène non prête.", {
      overlayId: preparedImage.overlayId,
      sourceItemId: preparedImage.sourceItemId,
    });
  }

  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult(action, "unavailable", "Action réservée au MJ.", {
      overlayId: preparedImage.overlayId,
      sourceItemId: preparedImage.sourceItemId,
    });
  }

  try {
    const existingOverlay = await findExistingStatsOverlay(token);
    const position = await getOverlayPosition(preparedImage);

    if (existingOverlay) {
      await OBR.scene.items.updateItems([existingOverlay.item], (items) => {
        const [draft] = items;
        if (!draft) return;

        draft.name = `Stats Overlay — ${preparedImage.tokenName}`;
        draft.position = position;
        draft.attachedTo = undefined;
        draft.layer = "PROP";
        draft.disableHit = true;
        draft.disableAutoZIndex = true;
        draft.disableAttachmentBehavior = undefined;
        draft.metadata = {
          ...draft.metadata,
          [STAT_OVERLAY_METADATA_KEY]: preparedImage.metadata,
        };

        if (isImage(draft)) {
          draft.image = getOverlayImageContent(preparedImage);
          draft.grid = getOverlayImageGrid();
        }
      });

      return createResult(action, "updated", "Overlay Stats mis à jour.", {
        overlayId: preparedImage.overlayId,
        sourceItemId: preparedImage.sourceItemId,
      });
    }

    const overlay = buildOverlayImage(preparedImage, position);
    await OBR.scene.items.addItems([overlay]);

    return createResult(action, "created", "Overlay Stats créé.", {
      overlayId: preparedImage.overlayId,
      sourceItemId: preparedImage.sourceItemId,
    });
  } catch (error) {
    return createResult(
      action,
      "error",
      error instanceof Error ? error.message : "Erreur Owlbear pendant la création de l'overlay.",
      {
        overlayId: preparedImage.overlayId,
        sourceItemId: preparedImage.sourceItemId,
      },
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
    const existingOverlay = await findExistingStatsOverlay(token);
    if (!existingOverlay) {
      return createResult(action, "not-found", "Aucun overlay Stats trouvé pour ce token.", {
        sourceItemId: token.sourceItemId,
      });
    }

    await OBR.scene.items.deleteItems([existingOverlay.item.id]);

    return createResult(action, "deleted", "Overlay Stats supprimé.", {
      overlayId: existingOverlay.metadata.overlayId,
      sourceItemId: existingOverlay.metadata.sourceItemId,
    });
  } catch (error) {
    return createResult(
      action,
      "error",
      error instanceof Error ? error.message : "Erreur Owlbear pendant la suppression de l'overlay.",
      { sourceItemId: token.sourceItemId },
    );
  }
}
