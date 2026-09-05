import OBR, {
  buildImage,
  buildLabel,
  buildShape,
  type BoundingBox,
  type Item,
  type Vector2,
} from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import type { StatTrackedToken, StatTrackerVisibility } from "../statTypes";
import {
  STAT_OVERLAY_KIND,
  STAT_OVERLAY_METADATA_KEY,
  type StatOverlayObrMetadata,
} from "./statTokenOverlayObrAdapter";
import { createOverlayId } from "./statTokenOverlayPlan";
import { getStatRoomSettings, type StatTokenDockPosition } from "./statRoomSettings";
import {
  createTokenSyncPayloadForVisibility,
  type StatTokenSyncItem,
  type StatTokenSyncPayload,
} from "./statTokenSync";

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

type OverlayItemsApi = Pick<typeof OBR.scene.items, "addItems" | "deleteItems" | "getItems">;

type DockCell = {
  item?: StatTokenSyncItem;
  overflowCount?: number;
  kind: "tracker" | "overflow";
  x: number;
  y: number;
  width: number;
  height: number;
};

type DockLayout = { cells: DockCell[]; width: number; height: number };

type PreparedAudience = {
  visibility: StatTrackerVisibility;
  payload: StatTokenSyncPayload;
  overlayId?: string;
  metadata?: StatOverlayObrMetadata;
  layout?: DockLayout;
};

type RenderContext = {
  token: StatTrackedToken;
  sourceItemId: string;
  metadata: StatOverlayObrMetadata;
  scale: number;
  sceneDpi: number;
};

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const MAX_TRACKERS = 6;
const ICON_LOGICAL_SIZE = 1024;

const TOKEN_GAP = 10;
const ITEM_GAP = 4;
const ROW_GAP = 4;
const VALUE_WIDTH = 104;
const TOGGLE_WIDTH = 112;
const ITEM_HEIGHT = 30;
const BAR_WIDTH = 150;
const BAR_HEIGHT = 40;
const ICON_UNIT_SIZE = 28;
const ICON_UNIT_GAP = 3;
const OVERFLOW_WIDTH = 38;
const OVERFLOW_HEIGHT = 24;

const COLOR_BACKGROUND = "#171a24";
const COLOR_TEXT = "#f7f5ff";
const COLOR_MUTED = "#9aa0ad";
const COLOR_BORDER = "#626978";
const COLOR_TRACK = "#090b10";

function createResult(
  action: StatOverlayObrManualAction,
  status: StatOverlayObrSyncStatus,
  message: string,
  details?: Pick<StatOverlayObrSyncResult, "overlayId" | "sourceItemId">,
): StatOverlayObrSyncResult {
  return { action, status, message, ...details };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVisibility(value: unknown): value is StatTrackerVisibility {
  return value === "public" || value === "private" || value === "gm";
}

function readOverlayMetadata(item: Item): StatOverlayObrMetadata | undefined {
  const value = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  if (!isRecord(value)) return undefined;
  if (
    value.kind !== STAT_OVERLAY_KIND ||
    typeof value.tokenId !== "string" ||
    typeof value.sourceItemId !== "string" ||
    typeof value.overlayId !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isVisibility(value.visibility)
  ) return undefined;

  return {
    kind: STAT_OVERLAY_KIND,
    tokenId: value.tokenId,
    sourceItemId: value.sourceItemId,
    overlayId: value.overlayId,
    updatedAt: value.updatedAt,
    visibility: value.visibility,
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

function canUseDockOverlaySync(): boolean {
  return Boolean(
    OBR.isAvailable &&
      isObrReady() &&
      typeof OBR.scene?.items?.getItems === "function" &&
      typeof OBR.scene.items.getItemBounds === "function" &&
      typeof OBR.scene.items.addItems === "function" &&
      typeof OBR.scene.items.deleteItems === "function" &&
      typeof OBR.scene.grid?.getDpi === "function" &&
      typeof OBR.scene.local?.getItems === "function" &&
      typeof OBR.scene.local.addItems === "function" &&
      typeof OBR.scene.local.deleteItems === "function",
  );
}

export function canUseObrOverlaySync(): boolean {
  return canUseDockOverlaySync();
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function absoluteAssetUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function tokenScale(bounds: BoundingBox, sceneDpi: number): number {
  const diameter = Math.max(bounds.width, bounds.height);
  if (!Number.isFinite(diameter) || !Number.isFinite(sceneDpi) || sceneDpi <= 0) return 1;
  return Math.max(0.25, diameter / sceneDpi);
}

function iconUnitCount(item: StatTokenSyncItem): number {
  return Math.min(6, Math.max(1, Math.round(item.max ?? 1)));
}

function cellSize(item: StatTokenSyncItem, scale: number) {
  if (item.mode === "bar") return { width: BAR_WIDTH * scale, height: BAR_HEIGHT * scale };
  if (item.mode === "icon") {
    const units = iconUnitCount(item);
    return {
      width: (units * ICON_UNIT_SIZE + (units - 1) * ICON_UNIT_GAP) * scale,
      height: ICON_UNIT_SIZE * scale,
    };
  }
  return {
    width: (item.mode === "toggle" ? TOGGLE_WIDTH : VALUE_WIDTH) * scale,
    height: ITEM_HEIGHT * scale,
  };
}

type Row = { cells: DockCell[]; width: number; height: number };

function dockLayout(payload: StatTokenSyncPayload, scale: number): DockLayout {
  const visible = payload.items.slice(0, MAX_TRACKERS);
  const hidden = Math.max(0, payload.items.length - visible.length);
  const rows: Row[] = [];
  let inline: StatTokenSyncItem[] = [];

  const flushInline = () => {
    if (!inline.length) return;
    let x = 0;
    let height = 0;
    const cells = inline.map((item, index) => {
      if (index > 0) x += ITEM_GAP * scale;
      const size = cellSize(item, scale);
      const cell: DockCell = { kind: "tracker", item, x, y: 0, ...size };
      x += size.width;
      height = Math.max(height, size.height);
      return cell;
    });
    rows.push({ cells, width: x, height });
    inline = [];
  };

  for (const item of visible) {
    if (item.mode === "bar" || item.mode === "icon") {
      flushInline();
      const size = cellSize(item, scale);
      rows.push({ cells: [{ kind: "tracker", item, x: 0, y: 0, ...size }], ...size });
    } else {
      inline.push(item);
      if (inline.length === 3) flushInline();
    }
  }
  flushInline();

  if (hidden > 0) {
    rows.push({
      cells: [{
        kind: "overflow",
        overflowCount: hidden,
        x: 0,
        y: 0,
        width: OVERFLOW_WIDTH * scale,
        height: OVERFLOW_HEIGHT * scale,
      }],
      width: OVERFLOW_WIDTH * scale,
      height: OVERFLOW_HEIGHT * scale,
    });
  }

  const width = rows.reduce((result, row) => Math.max(result, row.width), 0);
  const cells: DockCell[] = [];
  let y = 0;
  rows.forEach((row, rowIndex) => {
    const offsetX = (width - row.width) / 2;
    row.cells.forEach((cell) => cells.push({ ...cell, x: offsetX + cell.x, y }));
    y += row.height;
    if (rowIndex < rows.length - 1) y += ROW_GAP * scale;
  });
  return { cells, width, height: y };
}

function prepareAudience(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
  scale: number,
): PreparedAudience {
  const payload = createTokenSyncPayloadForVisibility(token, visibility);
  if (!payload.sourceItemId || payload.status !== "ready") return { visibility, payload };
  const overlayId = createOverlayId(payload.sourceItemId, visibility);
  return {
    visibility,
    payload,
    overlayId,
    layout: dockLayout(payload, scale),
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

function audienceOrigins(
  bounds: BoundingBox,
  audiences: PreparedAudience[],
  position: StatTokenDockPosition,
  scale: number,
): Map<StatTrackerVisibility, Vector2> {
  const result = new Map<StatTrackerVisibility, Vector2>();
  const gap = TOKEN_GAP * scale;
  let cursor = position === "top" ? bounds.min.y - gap : bounds.max.y + gap;

  for (const audience of audiences) {
    if (!audience.layout) continue;
    const x = bounds.center.x - audience.layout.width / 2;
    const y = position === "top" ? cursor - audience.layout.height : cursor;
    result.set(audience.visibility, { x, y });
    cursor = position === "top" ? y - gap : y + audience.layout.height + gap;
  }
  return result;
}

function elementMetadata(metadata: StatOverlayObrMetadata, element: string) {
  return { [STAT_OVERLAY_METADATA_KEY]: { ...metadata, element } };
}

function panel(
  ctx: RenderContext,
  id: string,
  position: Vector2,
  width: number,
  height: number,
  accent: string,
  active = true,
): Item {
  return buildShape()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .width(width)
    .height(height)
    .shapeType("RECTANGLE")
    .fillColor(active ? COLOR_BACKGROUND : "#242730")
    .fillOpacity(0.94)
    .strokeColor(active ? accent : COLOR_BORDER)
    .strokeOpacity(active ? 0.72 : 0.55)
    .strokeWidth(Math.max(1, height * 0.035))
    .position(position)
    .rotation(0)
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function text(
  ctx: RenderContext,
  id: string,
  value: string,
  position: Vector2,
  fontSize: number,
  color = COLOR_TEXT,
  weight = 600,
): Item {
  return buildLabel()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .plainText(value)
    .fontSize(Math.max(6, fontSize))
    .fontWeight(weight)
    .padding(0)
    .fillColor(color)
    .backgroundOpacity(0)
    .position(position)
    .rotation(0)
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function icon(
  ctx: RenderContext,
  id: string,
  item: StatTokenSyncItem,
  center: Vector2,
  size: number,
): Item | null {
  const url = absoluteAssetUrl(item.iconSrc);
  if (!url) return null;
  const imageScale = size / ctx.sceneDpi;
  return buildImage(
    { width: ICON_LOGICAL_SIZE, height: ICON_LOGICAL_SIZE, url, mime: "image/png" },
    { dpi: ICON_LOGICAL_SIZE, offset: { x: ICON_LOGICAL_SIZE / 2, y: ICON_LOGICAL_SIZE / 2 } },
  )
    .id(id)
    .name(`Stats Dock — ${ctx.token.name} — ${item.name}`)
    .position(center)
    .rotation(0)
    .scale({ x: imageScale, y: imageScale })
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function mute(ctx: RenderContext, id: string, position: Vector2, size: number): Item {
  return buildShape()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name} — inactive`)
    .width(size)
    .height(size)
    .shapeType("RECTANGLE")
    .fillColor("#858a94")
    .fillOpacity(0.62)
    .strokeOpacity(0)
    .position(position)
    .rotation(0)
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function shortName(value: string, max = 12): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function displayValue(item: StatTokenSyncItem): string {
  if (item.visualType === "counter" || item.visualType === "readonly") {
    return String(item.value ?? item.current ?? 0);
  }
  if (item.visualType === "bar") return `${item.current ?? 0}/${item.max ?? 0}`;
  return "";
}

function valueOrToggleItems(
  ctx: RenderContext,
  item: StatTokenSyncItem,
  cell: DockCell,
  origin: Vector2,
): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-${sanitizeId(item.id)}`;
  const active = item.mode !== "toggle" || item.enabled === true;
  const iconSize = 21 * ctx.scale;
  const center = { x: x + 15 * ctx.scale, y: y + cell.height / 2 };
  const result: Item[] = [
    panel(ctx, `${baseId}-panel`, { x, y }, cell.width, cell.height, item.accentColor, active),
  ];
  const iconItem = icon(ctx, `${baseId}-icon`, item, center, iconSize);
  if (iconItem) result.push(iconItem);
  if (!active) {
    result.push(mute(ctx, `${baseId}-mute`, { x: center.x - iconSize / 2, y: center.y - iconSize / 2 }, iconSize));
  }
  const suffix = item.mode === "value" ? ` ${displayValue(item)}` : "";
  result.push(
    text(
      ctx,
      `${baseId}-text`,
      `${shortName(item.name)}${suffix}`,
      { x: x + 29 * ctx.scale, y: y + cell.height / 2 },
      10.5 * ctx.scale,
      active ? COLOR_TEXT : COLOR_MUTED,
      item.mode === "value" ? 650 : 600,
    ),
  );
  return result;
}

function barItems(ctx: RenderContext, item: StatTokenSyncItem, cell: DockCell, origin: Vector2): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-${sanitizeId(item.id)}`;
  const result: Item[] = [panel(ctx, `${baseId}-panel`, { x, y }, cell.width, cell.height, item.accentColor)];
  const iconItem = icon(ctx, `${baseId}-icon`, item, { x: x + 15 * ctx.scale, y: y + 16 * ctx.scale }, 22 * ctx.scale);
  if (iconItem) result.push(iconItem);
  result.push(
    text(ctx, `${baseId}-name`, shortName(item.name, 13), { x: x + 30 * ctx.scale, y: y + 14 * ctx.scale }, 9.5 * ctx.scale),
    text(ctx, `${baseId}-value`, displayValue(item), { x: x + cell.width - 34 * ctx.scale, y: y + 14 * ctx.scale }, 10.5 * ctx.scale, COLOR_TEXT, 700),
  );

  const trackX = x + 30 * ctx.scale;
  const trackY = y + 28 * ctx.scale;
  const trackWidth = Math.max(24 * ctx.scale, cell.width - 38 * ctx.scale);
  const trackHeight = 5 * ctx.scale;
  const max = Math.max(0, item.max ?? 0);
  const current = Math.max(0, item.current ?? 0);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  result.push(
    buildShape()
      .id(`${baseId}-track`)
      .name(`Stats Dock — ${ctx.token.name} — track`)
      .width(trackWidth)
      .height(trackHeight)
      .shapeType("RECTANGLE")
      .fillColor(COLOR_TRACK)
      .fillOpacity(0.96)
      .strokeColor(COLOR_BORDER)
      .strokeOpacity(0.7)
      .strokeWidth(Math.max(0.8, ctx.scale))
      .position({ x: trackX, y: trackY })
      .rotation(0)
      .layer("ATTACHMENT")
      .attachedTo(ctx.sourceItemId)
      .locked(true)
      .disableHit(true)
      .disableAutoZIndex(true)
      .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
      .metadata(elementMetadata(ctx.metadata, `${baseId}-track`))
      .build(),
  );
  if (ratio > 0) {
    result.push(
      buildShape()
        .id(`${baseId}-fill`)
        .name(`Stats Dock — ${ctx.token.name} — fill`)
        .width(Math.max(1, trackWidth * ratio))
        .height(trackHeight)
        .shapeType("RECTANGLE")
        .fillColor(item.accentColor)
        .fillOpacity(0.98)
        .strokeOpacity(0)
        .position({ x: trackX, y: trackY })
        .rotation(0)
        .layer("ATTACHMENT")
        .attachedTo(ctx.sourceItemId)
        .locked(true)
        .disableHit(true)
        .disableAutoZIndex(true)
        .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
        .metadata(elementMetadata(ctx.metadata, `${baseId}-fill`))
        .build(),
    );
  }
  return result;
}

function iconUnitItems(ctx: RenderContext, item: StatTokenSyncItem, cell: DockCell, origin: Vector2): Item[] {
  const result: Item[] = [];
  const max = iconUnitCount(item);
  const current = Math.min(max, Math.max(0, Math.round(item.current ?? 0)));
  const size = ICON_UNIT_SIZE * ctx.scale;
  const gap = ICON_UNIT_GAP * ctx.scale;
  const startX = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-${sanitizeId(item.id)}`;

  for (let index = 0; index < max; index += 1) {
    const active = index < current;
    const x = startX + index * (size + gap);
    result.push(panel(ctx, `${baseId}-unit-${index}-panel`, { x, y }, size, size, item.accentColor, active));
    const iconItem = icon(ctx, `${baseId}-unit-${index}-icon`, item, { x: x + size / 2, y: y + size / 2 }, 20 * ctx.scale);
    if (iconItem) result.push(iconItem);
    if (!active) {
      result.push(mute(ctx, `${baseId}-unit-${index}-mute`, { x: x + 2 * ctx.scale, y: y + 2 * ctx.scale }, size - 4 * ctx.scale));
    }
  }
  return result;
}

function overflowItems(ctx: RenderContext, cell: DockCell, origin: Vector2): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-overflow`;
  return [
    panel(ctx, `${baseId}-panel`, { x, y }, cell.width, cell.height, COLOR_BORDER),
    text(ctx, `${baseId}-text`, `+${cell.overflowCount ?? 0}`, { x: x + 10 * ctx.scale, y: y + cell.height / 2 }, 9.5 * ctx.scale, COLOR_MUTED, 700),
  ];
}

function audienceItems(
  token: StatTrackedToken,
  sourceItemId: string,
  audience: PreparedAudience,
  origin: Vector2,
  scale: number,
  sceneDpi: number,
): Item[] {
  if (!audience.layout || !audience.metadata) return [];
  const ctx: RenderContext = { token, sourceItemId, metadata: audience.metadata, scale, sceneDpi };
  return audience.layout.cells.flatMap((cell) => {
    if (cell.kind === "overflow") return overflowItems(ctx, cell, origin);
    const item = cell.item;
    if (!item) return [];
    if (item.mode === "bar") return barItems(ctx, item, cell, origin);
    if (item.mode === "icon") return iconUnitItems(ctx, item, cell, origin);
    return valueOrToggleItems(ctx, item, cell, origin);
  });
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

export async function findExistingStatsOverlay(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility = "public",
): Promise<StatOverlayObrExistingOverlay | undefined> {
  if (!canUseDockOverlaySync()) return undefined;
  return (await findOverlays(token, visibility))[0];
}

async function replaceAudienceItems(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
  desired: Item[],
): Promise<{ created: number; deleted: number }> {
  const api = getAudienceApi(visibility);
  const existing = await findOverlays(token, visibility);
  if (existing.length > 0) await api.deleteItems(existing.map(({ item }) => item.id));
  if (desired.length > 0) await api.addItems(desired);
  return { created: desired.length, deleted: existing.length };
}

export async function createOrUpdateTokenOverlay(token: StatTrackedToken): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "create-or-update";
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
  if (!canUseDockOverlaySync()) {
    return createResult(action, "unavailable", "Owlbear indisponible ou scène non prête.", { sourceItemId });
  }
  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult(action, "unavailable", "Action réservée au MJ.", { sourceItemId });
  }

  try {
    const [bounds, sceneDpi, settings] = await Promise.all([
      OBR.scene.items.getItemBounds([sourceItemId]),
      OBR.scene.grid.getDpi(),
      getStatRoomSettings(),
    ]);
    const scale = tokenScale(bounds, sceneDpi);
    const audiences = AUDIENCES.map((visibility) => prepareAudience(token, visibility, scale));
    const origins = audienceOrigins(bounds, audiences, settings.tokenStatsPosition, scale);
    let created = 0;
    let deleted = 0;

    for (const audience of audiences) {
      const origin = origins.get(audience.visibility);
      const desired = origin ? audienceItems(token, sourceItemId, audience, origin, scale, sceneDpi) : [];
      const result = await replaceAudienceItems(token, audience.visibility, desired);
      created += result.created;
      deleted += result.deleted;
    }

    const counts = Object.fromEntries(
      audiences.map(({ visibility, payload }) => [visibility, payload.itemCount]),
    ) as Record<StatTrackerVisibility, number>;
    const message = `Public ${counts.public} · Privé ${counts.private} · MJ ${counts.gm}`;

    if (created > 0) {
      return createResult(action, deleted > 0 ? "updated" : "created", `Stat Dock mis à jour · ${message}`, { sourceItemId });
    }
    if (deleted > 0) return createResult(action, "updated", `Stat Dock retiré · ${message}`, { sourceItemId });
    return createResult(action, "not-ready", "Aucun tracker activé pour affichage token.", { sourceItemId });
  } catch (error) {
    return createResult(action, "error", error instanceof Error ? error.message : "Erreur Owlbear pendant la mise à jour.", { sourceItemId });
  }
}

export async function deleteTokenOverlay(token: StatTrackedToken): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "delete";
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
  if (!canUseDockOverlaySync()) return createResult(action, "unavailable", "Owlbear indisponible ou scène non prête.", { sourceItemId });
  if (!(await canCurrentPlayerManageOverlays())) return createResult(action, "unavailable", "Action réservée au MJ.", { sourceItemId });

  try {
    let deleted = 0;
    for (const visibility of AUDIENCES) {
      const api = getAudienceApi(visibility);
      const overlays = await findOverlays(token, visibility);
      if (!overlays.length) continue;
      await api.deleteItems(overlays.map(({ item }) => item.id));
      deleted += overlays.length;
    }
    return createResult(
      action,
      deleted > 0 ? "deleted" : "not-found",
      deleted > 0 ? "Stat Dock supprimé." : "Aucun Stat Dock trouvé.",
      { sourceItemId },
    );
  } catch (error) {
    return createResult(action, "error", error instanceof Error ? error.message : "Erreur Owlbear pendant la suppression.", { sourceItemId });
  }
}
