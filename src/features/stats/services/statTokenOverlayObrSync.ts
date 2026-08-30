import OBR, {
  buildLabel,
  isLabel,
  type BoundingBox,
  type Item,
  type Label,
  type Vector2,
} from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import type {
  StatTrackedToken,
  StatTrackerVisibility,
} from "../statTypes";
import {
  STAT_OVERLAY_KIND,
  STAT_OVERLAY_METADATA_KEY,
  type StatOverlayObrMetadata,
} from "./statTokenOverlayObrAdapter";
import { createOverlayId } from "./statTokenOverlayPlan";
import {
  createTokenSyncPayloadForVisibility,
  type StatTokenSyncItem,
  type StatTokenSyncPayload,
} from "./statTokenSync";
import { getTrackerIcon } from "./statTrackerIcons";

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
  payload: StatTokenSyncPayload;
  overlayId?: string;
  labelText: string;
  lineCount: number;
  visibleItemCount: number;
  metadata?: StatOverlayObrMetadata;
};

const OVERLAY_GAP = 10;
const OVERLAY_FONT_SIZE = 11;
const OVERLAY_PADDING = 4;
const OVERLAY_LINE_HEIGHT = 17;
const OVERLAY_BASE_HEIGHT = OVERLAY_FONT_SIZE + OVERLAY_PADDING * 2;
const OVERLAY_BACKGROUND = "#202230";
const OVERLAY_TEXT = "#f6f3ff";
const OVERLAY_ITEMS_PER_LINE = 3;
const OVERLAY_MAX_ITEMS = 6;
const OVERLAY_MAX_ITEM_LENGTH = 24;
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
    // Legacy V2.5F overlays had no audience and are treated as public so the
    // next manual update can replace them safely.
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

function truncateOverlayText(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= OVERLAY_MAX_ITEM_LENGTH) return trimmed;
  return `${trimmed.slice(0, OVERLAY_MAX_ITEM_LENGTH - 1)}…`;
}

function formatOverlayItem(item: StatTokenSyncItem): string {
  const icon = getTrackerIcon(item.iconId).symbol;
  if (item.mode === "icon") return icon;
  return truncateOverlayText(`${icon} ${item.label}`.trim());
}

function getOverlayLabelLayout(payload: StatTokenSyncPayload): {
  text: string;
  lineCount: number;
  visibleItemCount: number;
} {
  const visibleItems = payload.items.slice(0, OVERLAY_MAX_ITEMS);
  const formatted = visibleItems.map(formatOverlayItem);
  const hiddenCount = Math.max(0, payload.items.length - visibleItems.length);
  const lines: string[] = [];

  for (let index = 0; index < formatted.length; index += OVERLAY_ITEMS_PER_LINE) {
    lines.push(formatted.slice(index, index + OVERLAY_ITEMS_PER_LINE).join("   ·   "));
  }

  if (hiddenCount > 0) {
    const overflow = `+${hiddenCount}`;
    if (lines.length === 0) {
      lines.push(overflow);
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]}   ${overflow}`;
    }
  }

  return {
    text: lines.join("\n"),
    lineCount: Math.max(1, lines.length),
    visibleItemCount: visibleItems.length,
  };
}

function prepareAudience(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
): PreparedAudience {
  const payload = createTokenSyncPayloadForVisibility(token, visibility);
  if (!payload.sourceItemId || payload.status !== "ready") {
    return {
      visibility,
      payload,
      labelText: "",
      lineCount: 0,
      visibleItemCount: 0,
    };
  }

  const overlayId = createOverlayId(payload.sourceItemId, visibility);
  const layout = getOverlayLabelLayout(payload);
  return {
    visibility,
    payload,
    overlayId,
    labelText: layout.text,
    lineCount: layout.lineCount,
    visibleItemCount: layout.visibleItemCount,
    metadata: {
      kind: STAT_OVERLAY_KIND,
      tokenId: token.id,
      sourceItemId: payload.sourceItemId,
      overlayId,
      updatedAt: token.updatedAt,
      visibility,
    },
  };
}

function getPreparedAudiences(token: StatTrackedToken): PreparedAudience[] {
  return AUDIENCES.map((visibility) => prepareAudience(token, visibility));
}

function getAudienceHeight(audience: PreparedAudience): number {
  if (audience.lineCount <= 1) return OVERLAY_BASE_HEIGHT;
  return OVERLAY_BASE_HEIGHT + (audience.lineCount - 1) * OVERLAY_LINE_HEIGHT;
}

function getAudiencePositions(
  bounds: BoundingBox,
  audiences: PreparedAudience[],
): Map<StatTrackerVisibility, Vector2> {
  const positions = new Map<StatTrackerVisibility, Vector2>();
  let stackedHeight = 0;

  for (const audience of audiences) {
    if (audience.payload.status !== "ready") continue;

    const height = getAudienceHeight(audience);
    positions.set(audience.visibility, {
      x: bounds.center.x,
      y: bounds.min.y - OVERLAY_GAP - stackedHeight,
    });
    stackedHeight += height + OVERLAY_GAP;
  }

  return positions;
}

function buildOverlayLabel(
  token: StatTrackedToken,
  audience: PreparedAudience,
  position: Vector2,
): Label {
  if (!token.sourceItemId || !audience.overlayId || !audience.metadata) {
    throw new Error("Overlay Stats incomplet.");
  }

  return buildLabel()
    .id(audience.overlayId)
    .name(`Stats Overlay ${audience.visibility} — ${token.name}`)
    .plainText(audience.labelText)
    .fontSize(OVERLAY_FONT_SIZE)
    .fontWeight(600)
    .padding(OVERLAY_PADDING)
    .fillColor(OVERLAY_TEXT)
    .backgroundColor(OVERLAY_BACKGROUND)
    .backgroundOpacity(0.86)
    .cornerRadius(6)
    .position(position)
    .rotation(0)
    .scale({ x: 1, y: 1 })
    .layer("ATTACHMENT")
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata({
      [STAT_OVERLAY_METADATA_KEY]: audience.metadata,
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
  audience: PreparedAudience,
  position: Vector2,
): Promise<"created" | "updated"> {
  const api = getAudienceApi(audience.visibility);
  const overlays = await findOverlays(token, audience.visibility);
  const [existing, ...duplicates] = overlays;
  const nextLabel = buildOverlayLabel(token, audience, position);

  if (duplicates.length > 0) {
    await api.deleteItems(duplicates.map(({ item }) => item.id));
  }

  // Old V2.5F image overlays are replaced automatically on the next manual
  // update. Native labels avoid data-URL image loading failures in Owlbear.
  if (!existing || !isLabel(existing.item)) {
    if (existing) await api.deleteItems([existing.item.id]);
    await api.addItems([nextLabel]);
    return "created";
  }

  await api.updateItems([existing.item], (items) => {
    const [draft] = items;
    if (!draft || !isLabel(draft)) return;

    draft.name = nextLabel.name;
    draft.position = nextLabel.position;
    draft.rotation = 0;
    draft.scale = { x: 1, y: 1 };
    draft.attachedTo = token.sourceItemId;
    draft.layer = "ATTACHMENT";
    draft.locked = true;
    draft.disableHit = true;
    draft.disableAutoZIndex = true;
    draft.disableAttachmentBehavior = ["COPY", "SCALE", "ROTATION"];
    draft.text = nextLabel.text;
    draft.style = nextLabel.style;
    draft.metadata = {
      ...draft.metadata,
      [STAT_OVERLAY_METADATA_KEY]: audience.metadata,
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

  try {
    const bounds = await OBR.scene.items.getItemBounds([token.sourceItemId]);
    const positions = getAudiencePositions(bounds, audiences);
    let createdCount = 0;
    let updatedCount = 0;
    let removedCount = 0;

    for (const audience of audiences) {
      const position = positions.get(audience.visibility);

      if (
        audience.payload.status !== "ready" ||
        !audience.overlayId ||
        !audience.metadata ||
        !position
      ) {
        removedCount += await deleteAudienceOverlays(token, audience.visibility);
        continue;
      }

      const outcome = await upsertAudienceOverlay(token, audience, position);
      if (outcome === "created") createdCount += 1;
      else updatedCount += 1;
    }

    const counts = Object.fromEntries(
      audiences.map(({ visibility, payload }) => [visibility, payload.itemCount]),
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
