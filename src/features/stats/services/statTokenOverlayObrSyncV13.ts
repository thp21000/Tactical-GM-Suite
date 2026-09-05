import OBR, {
  buildImage,
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
type TextAlign = "LEFT" | "CENTER" | "RIGHT";
type Cell = {
  kind: "tracker" | "overflow";
  item?: StatTokenSyncItem;
  overflowCount?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
type Layout = { cells: Cell[]; width: number; height: number };
type Audience = {
  visibility: StatTrackerVisibility;
  payload: StatTokenSyncPayload;
  metadata?: StatOverlayObrMetadata;
  layout?: Layout;
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

const TOKEN_GAP = 7;
const AUDIENCE_GAP = 2;
const ITEM_GAP = 4;
const ROW_GAP = 4;
const VALUE_WIDTH = 100;
const TOGGLE_WIDTH = 124;
const ITEM_HEIGHT = 36;
const BAR_WIDTH = 170;
const BAR_HEIGHT = 48;
const ICON_UNIT_SIZE = 30;
const ICON_UNIT_GAP = 3;
const OVERFLOW_WIDTH = 42;
const OVERFLOW_HEIGHT = 24;

const Z_PLATE = 10;
const Z_DETAIL = 20;
const Z_ICON = 30;
const Z_TEXT = 40;
const Z_MUTE = 50;

const COLOR_TEXT = "#f4efe4";
const COLOR_VALUE = "#fff5dc";
const COLOR_MUTED = "#9b9fa6";
const COLOR_TEXT_STROKE = "#06070a";
const COLOR_TRACK = "#070a0f";
const COLOR_TRACK_BORDER = "#7b6b58";

const PLATE_ASSET = "assets/stats/stat-plate.svg";
const PLATE_MUTED_ASSET = "assets/stats/stat-plate-muted.svg";
const UNIT_ASSET = "assets/stats/stat-unit.svg";
const UNIT_MUTED_ASSET = "assets/stats/stat-unit-muted.svg";
const TEXT_LAYER_ASSET = "assets/stats/stat-text-layer.svg";

function result(
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

function readMetadata(item: Item): StatOverlayObrMetadata | undefined {
  const value = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  if (!isRecord(value)) return undefined;
  if (
    value.kind !== STAT_OVERLAY_KIND ||
    typeof value.tokenId !== "string" ||
    typeof value.sourceItemId !== "string" ||
    typeof value.overlayId !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isVisibility(value.visibility)
  ) {
    return undefined;
  }
  return {
    kind: STAT_OVERLAY_KIND,
    tokenId: value.tokenId,
    sourceItemId: value.sourceItemId,
    overlayId: value.overlayId,
    updatedAt: value.updatedAt,
    visibility: value.visibility,
  };
}

function matchesOverlay(item: Item, token: StatTrackedToken, visibility?: StatTrackerVisibility): boolean {
  const metadata = readMetadata(item);
  return Boolean(
    metadata &&
      token.sourceItemId &&
      metadata.tokenId === token.id &&
      metadata.sourceItemId === token.sourceItemId &&
      (!visibility || metadata.visibility === visibility),
  );
}

function audienceApi(visibility: StatTrackerVisibility): OverlayItemsApi {
  return visibility === "public" ? OBR.scene.items : OBR.scene.local;
}

async function isGm(): Promise<boolean> {
  try {
    return (await OBR.player.getRole()) === "GM";
  } catch {
    return false;
  }
}

function canSync(): boolean {
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
  return canSync();
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function assetUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.href).href;
  } catch {
    return path;
  }
}

function tokenScale(bounds: BoundingBox, sceneDpi: number): number {
  const diameter = Math.max(bounds.width, bounds.height);
  if (!Number.isFinite(diameter) || !Number.isFinite(sceneDpi) || sceneDpi <= 0) return 1;
  return Math.max(0.25, diameter / sceneDpi);
}

function elementMetadata(metadata: StatOverlayObrMetadata, element: string) {
  return { [STAT_OVERLAY_METADATA_KEY]: { ...metadata, element } };
}

function imageItem(
  ctx: RenderContext,
  id: string,
  path: string,
  logicalWidth: number,
  logicalHeight: number,
  position: Vector2,
  width: number,
  height: number,
  zIndex: number,
): Item {
  const url = assetUrl(path) ?? path;
  return buildImage(
    { width: logicalWidth, height: logicalHeight, url, mime: "image/svg+xml" },
    { dpi: logicalWidth, offset: { x: logicalWidth / 2, y: logicalHeight / 2 } },
  )
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .position({ x: position.x + width / 2, y: position.y + height / 2 })
    .rotation(0)
    .zIndex(zIndex)
    .scale({
      x: width / ctx.sceneDpi,
      y: (height * logicalWidth) / (logicalHeight * ctx.sceneDpi),
    })
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function textImage(
  ctx: RenderContext,
  id: string,
  value: string,
  position: Vector2,
  width: number,
  height: number,
  fontSize: number,
  color = COLOR_TEXT,
  weight = 650,
  align: TextAlign = "LEFT",
): Item {
  const logicalWidth = 320;
  const logicalHeight = 96;
  const url = assetUrl(TEXT_LAYER_ASSET) ?? TEXT_LAYER_ASSET;
  return buildImage(
    { width: logicalWidth, height: logicalHeight, url, mime: "image/svg+xml" },
    { dpi: logicalWidth, offset: { x: logicalWidth / 2, y: logicalHeight / 2 } },
  )
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .plainText(value)
    .textType("PLAIN")
    .textItemType("TEXT")
    .textWidth(logicalWidth)
    .textHeight(logicalHeight)
    .textPadding(0)
    .fontFamily("Arial")
    .fontSize(fontSize)
    .fontWeight(weight)
    .textAlign(align)
    .textAlignVertical("MIDDLE")
    .textFillColor(color)
    .textFillOpacity(1)
    .textStrokeColor(COLOR_TEXT_STROKE)
    .textStrokeOpacity(0.86)
    .textStrokeWidth(2.2)
    .textLineHeight(1)
    .position({ x: position.x + width / 2, y: position.y + height / 2 })
    .rotation(0)
    .zIndex(Z_TEXT)
    .scale({
      x: width / ctx.sceneDpi,
      y: (height * logicalWidth) / (logicalHeight * ctx.sceneDpi),
    })
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function shapeItem(
  ctx: RenderContext,
  id: string,
  position: Vector2,
  width: number,
  height: number,
  fillColor: string,
  fillOpacity: number,
  strokeColor?: string,
  strokeOpacity = 0,
  strokeWidth = 0,
  zIndex = Z_DETAIL,
): Item {
  return buildShape()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .width(width)
    .height(height)
    .shapeType("RECTANGLE")
    .fillColor(fillColor)
    .fillOpacity(fillOpacity)
    .strokeColor(strokeColor ?? fillColor)
    .strokeOpacity(strokeOpacity)
    .strokeWidth(strokeWidth)
    .position(position)
    .rotation(0)
    .zIndex(zIndex)
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function plate(ctx: RenderContext, id: string, position: Vector2, width: number, height: number, muted = false) {
  return imageItem(ctx, id, muted ? PLATE_MUTED_ASSET : PLATE_ASSET, 320, 96, position, width, height, Z_PLATE);
}

function unitFrame(ctx: RenderContext, id: string, position: Vector2, size: number, muted = false) {
  return imageItem(ctx, id, muted ? UNIT_MUTED_ASSET : UNIT_ASSET, 96, 96, position, size, size, Z_DETAIL);
}

function iconItem(
  ctx: RenderContext,
  id: string,
  item: StatTokenSyncItem,
  center: Vector2,
  size: number,
): Item | null {
  const url = assetUrl(item.iconSrc);
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
    .zIndex(Z_ICON)
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

function iconTile(
  ctx: RenderContext,
  baseId: string,
  item: StatTokenSyncItem,
  position: Vector2,
  size: number,
  active: boolean,
): Item[] {
  const items: Item[] = [unitFrame(ctx, `${baseId}-tile`, position, size, !active)];
  const icon = iconItem(ctx, `${baseId}-icon`, item, { x: position.x + size / 2, y: position.y + size / 2 }, size * 0.74);
  if (icon) items.push(icon);
  if (!active) {
    items.push(
      shapeItem(
        ctx,
        `${baseId}-mute`,
        { x: position.x + size * 0.16, y: position.y + size * 0.16 },
        size * 0.68,
        size * 0.68,
        "#85888e",
        0.58,
        undefined,
        0,
        0,
        Z_MUTE,
      ),
    );
  }
  return items;
}

function shortName(value: string, max = 11): string {
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

function makeLayout(payload: StatTokenSyncPayload, scale: number): Layout {
  const visible = payload.items.slice(0, MAX_TRACKERS);
  const hidden = Math.max(0, payload.items.length - visible.length);
  const rows: Array<{ cells: Cell[]; width: number; height: number }> = [];
  let inline: StatTokenSyncItem[] = [];

  const flushInline = () => {
    if (!inline.length) return;
    let x = 0;
    let height = 0;
    const cells = inline.map((item, index) => {
      if (index > 0) x += ITEM_GAP * scale;
      const size = cellSize(item, scale);
      const cell: Cell = { kind: "tracker", item, x, y: 0, ...size };
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
      cells: [{ kind: "overflow", overflowCount: hidden, x: 0, y: 0, width: OVERFLOW_WIDTH * scale, height: OVERFLOW_HEIGHT * scale }],
      width: OVERFLOW_WIDTH * scale,
      height: OVERFLOW_HEIGHT * scale,
    });
  }

  const width = rows.reduce((max, row) => Math.max(max, row.width), 0);
  const cells: Cell[] = [];
  let y = 0;
  rows.forEach((row, index) => {
    const offsetX = (width - row.width) / 2;
    row.cells.forEach((cell) => cells.push({ ...cell, x: offsetX + cell.x, y }));
    y += row.height;
    if (index < rows.length - 1) y += ROW_GAP * scale;
  });
  return { cells, width, height: y };
}

function prepareAudience(token: StatTrackedToken, visibility: StatTrackerVisibility, scale: number): Audience {
  const payload = createTokenSyncPayloadForVisibility(token, visibility);
  if (!payload.sourceItemId || payload.status !== "ready") return { visibility, payload };
  return {
    visibility,
    payload,
    layout: makeLayout(payload, scale),
    metadata: {
      kind: STAT_OVERLAY_KIND,
      tokenId: token.id,
      sourceItemId: payload.sourceItemId,
      overlayId: createOverlayId(payload.sourceItemId, visibility),
      updatedAt: token.updatedAt,
      visibility,
    },
  };
}

function origins(
  bounds: BoundingBox,
  audiences: Audience[],
  position: StatTokenDockPosition,
  scale: number,
): Map<StatTrackerVisibility, Vector2> {
  const map = new Map<StatTrackerVisibility, Vector2>();
  const tokenGap = TOKEN_GAP * scale;
  const groupGap = AUDIENCE_GAP * scale;
  let cursor = position === "top" ? bounds.min.y - tokenGap : bounds.max.y + tokenGap;
  for (const audience of audiences) {
    if (!audience.layout) continue;
    const x = bounds.center.x - audience.layout.width / 2;
    const y = position === "top" ? cursor - audience.layout.height : cursor;
    map.set(audience.visibility, { x, y });
    cursor = position === "top" ? y - groupGap : y + audience.layout.height + groupGap;
  }
  return map;
}

function simpleItems(ctx: RenderContext, item: StatTokenSyncItem, cell: Cell, origin: Vector2): Item[] {
  const s = ctx.scale;
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-${sanitizeId(item.id)}`;
  const active = item.mode !== "toggle" || item.enabled === true;
  const items: Item[] = [plate(ctx, `${baseId}-plate`, { x, y }, cell.width, cell.height, !active)];

  const tileSize = 28 * s;
  const tilePosition = { x: x + 5 * s, y: y + (cell.height - tileSize) / 2 };
  items.push(...iconTile(ctx, baseId, item, tilePosition, tileSize, active));

  const textX = x + 38 * s;
  const textY = y + 1 * s;
  const textHeight = cell.height - 2 * s;
  if (item.mode === "toggle") {
    items.push(
      textImage(
        ctx,
        `${baseId}-name`,
        shortName(item.name, 16),
        { x: textX, y: textY },
        cell.width - 44 * s,
        textHeight,
        42,
        active ? COLOR_TEXT : COLOR_MUTED,
        active ? 750 : 600,
      ),
    );
    return items;
  }

  const valueWidth = 28 * s;
  const nameWidth = Math.max(12 * s, cell.width - 44 * s - valueWidth);
  items.push(
    textImage(ctx, `${baseId}-name`, shortName(item.name), { x: textX, y: textY }, nameWidth, textHeight, 38, COLOR_TEXT, 650),
    textImage(
      ctx,
      `${baseId}-value`,
      displayValue(item),
      { x: x + cell.width - valueWidth - 6 * s, y: textY },
      valueWidth,
      textHeight,
      50,
      COLOR_VALUE,
      800,
      "RIGHT",
    ),
  );
  return items;
}

function barItems(ctx: RenderContext, item: StatTokenSyncItem, cell: Cell, origin: Vector2): Item[] {
  const s = ctx.scale;
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-${sanitizeId(item.id)}`;
  const items: Item[] = [plate(ctx, `${baseId}-plate`, { x, y }, cell.width, cell.height)];

  const tileSize = 34 * s;
  const tilePosition = { x: x + 6 * s, y: y + (cell.height - tileSize) / 2 };
  items.push(...iconTile(ctx, baseId, item, tilePosition, tileSize, true));

  const contentX = x + 46 * s;
  const contentWidth = cell.width - 52 * s;
  items.push(
    textImage(
      ctx,
      `${baseId}-name`,
      shortName(item.name, 15),
      { x: contentX, y: y + 2 * s },
      Math.max(14 * s, contentWidth - 42 * s),
      18 * s,
      36,
      COLOR_TEXT,
      650,
    ),
    textImage(
      ctx,
      `${baseId}-value`,
      displayValue(item),
      { x: x + cell.width - 43 * s, y: y + 2 * s },
      36 * s,
      18 * s,
      50,
      COLOR_VALUE,
      800,
      "RIGHT",
    ),
  );

  const trackX = contentX;
  const trackY = y + 30 * s;
  const trackWidth = Math.max(28 * s, contentWidth - 1 * s);
  const trackHeight = 9 * s;
  const max = Math.max(0, item.max ?? 0);
  const current = Math.max(0, item.current ?? 0);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  items.push(
    shapeItem(ctx, `${baseId}-track`, { x: trackX, y: trackY }, trackWidth, trackHeight, COLOR_TRACK, 0.98, COLOR_TRACK_BORDER, 0.95, Math.max(0.8, 1.1 * s)),
  );
  if (ratio > 0) {
    items.push(
      shapeItem(
        ctx,
        `${baseId}-fill`,
        { x: trackX + 1.2 * s, y: trackY + 1.2 * s },
        Math.max(1.5 * s, (trackWidth - 2.4 * s) * ratio),
        trackHeight - 2.4 * s,
        item.accentColor,
        0.98,
      ),
      shapeItem(
        ctx,
        `${baseId}-shine`,
        { x: trackX + 2 * s, y: trackY + 1.8 * s },
        Math.max(1, (trackWidth - 4 * s) * ratio),
        1.1 * s,
        "#ffffff",
        0.24,
      ),
    );
  }
  return items;
}

function iconItems(ctx: RenderContext, item: StatTokenSyncItem, cell: Cell, origin: Vector2): Item[] {
  const items: Item[] = [];
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
    items.push(...iconTile(ctx, `${baseId}-unit-${index}`, item, { x, y }, size, active));
  }
  return items;
}

function overflowItems(ctx: RenderContext, cell: Cell, origin: Vector2): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-overflow`;
  return [
    plate(ctx, `${baseId}-plate`, { x, y }, cell.width, cell.height, true),
    textImage(ctx, `${baseId}-text`, `+${cell.overflowCount ?? 0}`, { x, y }, cell.width, cell.height, 40, COLOR_MUTED, 800, "CENTER"),
  ];
}

function renderAudience(
  token: StatTrackedToken,
  sourceItemId: string,
  audience: Audience,
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
    if (item.mode === "icon") return iconItems(ctx, item, cell, origin);
    return simpleItems(ctx, item, cell, origin);
  });
}

async function findOverlays(token: StatTrackedToken, visibility: StatTrackerVisibility): Promise<StatOverlayObrExistingOverlay[]> {
  if (!token.sourceItemId) return [];
  const items = await audienceApi(visibility).getItems();
  return items.flatMap((item) => {
    if (!matchesOverlay(item, token, visibility)) return [];
    const metadata = readMetadata(item);
    return metadata ? [{ item, metadata }] : [];
  });
}

export async function findExistingStatsOverlay(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility = "public",
): Promise<StatOverlayObrExistingOverlay | undefined> {
  if (!canSync()) return undefined;
  return (await findOverlays(token, visibility))[0];
}

async function replaceAudience(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
  desired: Item[],
): Promise<{ created: number; deleted: number }> {
  const api = audienceApi(visibility);
  const existing = await findOverlays(token, visibility);
  if (existing.length > 0) await api.deleteItems(existing.map(({ item }) => item.id));
  if (desired.length > 0) await api.addItems(desired);
  return { created: desired.length, deleted: existing.length };
}

export async function createOrUpdateTokenOverlay(token: StatTrackedToken): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "create-or-update";
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return result(action, "not-ready", "Token non lié à un item Owlbear.");
  if (!canSync()) return result(action, "unavailable", "Owlbear indisponible ou scène non prête.", { sourceItemId });
  if (!(await isGm())) return result(action, "unavailable", "Action réservée au MJ.", { sourceItemId });

  try {
    const [bounds, sceneDpi, settings] = await Promise.all([
      OBR.scene.items.getItemBounds([sourceItemId]),
      OBR.scene.grid.getDpi(),
      getStatRoomSettings(),
    ]);
    const scale = tokenScale(bounds, sceneDpi);
    const audiences = AUDIENCES.map((visibility) => prepareAudience(token, visibility, scale));
    const audienceOrigins = origins(bounds, audiences, settings.tokenStatsPosition, scale);
    let created = 0;
    let deleted = 0;

    for (const audience of audiences) {
      const origin = audienceOrigins.get(audience.visibility);
      const desired = origin ? renderAudience(token, sourceItemId, audience, origin, scale, sceneDpi) : [];
      const change = await replaceAudience(token, audience.visibility, desired);
      created += change.created;
      deleted += change.deleted;
    }

    const counts = Object.fromEntries(
      audiences.map(({ visibility, payload }) => [visibility, payload.itemCount]),
    ) as Record<StatTrackerVisibility, number>;
    const summary = `Public ${counts.public} · Privé ${counts.private} · MJ ${counts.gm}`;
    if (created > 0) {
      return result(action, deleted > 0 ? "updated" : "created", `Stat Dock mis à jour · ${summary}`, { sourceItemId });
    }
    if (deleted > 0) return result(action, "updated", `Stat Dock retiré · ${summary}`, { sourceItemId });
    return result(action, "not-ready", "Aucun tracker activé pour affichage token.", { sourceItemId });
  } catch (error) {
    return result(action, "error", error instanceof Error ? error.message : "Erreur Owlbear pendant la mise à jour.", { sourceItemId });
  }
}

export async function deleteTokenOverlay(token: StatTrackedToken): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "delete";
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return result(action, "not-ready", "Token non lié à un item Owlbear.");
  if (!canSync()) return result(action, "unavailable", "Owlbear indisponible ou scène non prête.", { sourceItemId });
  if (!(await isGm())) return result(action, "unavailable", "Action réservée au MJ.", { sourceItemId });

  try {
    let deleted = 0;
    for (const visibility of AUDIENCES) {
      const api = audienceApi(visibility);
      const overlays = await findOverlays(token, visibility);
      if (!overlays.length) continue;
      await api.deleteItems(overlays.map(({ item }) => item.id));
      deleted += overlays.length;
    }
    return result(
      action,
      deleted > 0 ? "deleted" : "not-found",
      deleted > 0 ? "Stat Dock supprimé." : "Aucun Stat Dock trouvé.",
      { sourceItemId },
    );
  } catch (error) {
    return result(action, "error", error instanceof Error ? error.message : "Erreur Owlbear pendant la suppression.", { sourceItemId });
  }
}
