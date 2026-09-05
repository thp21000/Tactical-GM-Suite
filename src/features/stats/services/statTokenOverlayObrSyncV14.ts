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
import { preloadStatPngAssets } from "./statAssetPreload";
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
type Row = { cells: DockCell[]; width: number; height: number };
type TextAlign = "LEFT" | "CENTER" | "RIGHT";

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const MAX_TRACKERS = 6;
const ICON_LOGICAL_SIZE = 1024;

const TOKEN_GAP = 8;
const AUDIENCE_GAP = 2;
const ITEM_GAP = 4;
const ROW_GAP = 4;
const VALUE_WIDTH = 110;
const TOGGLE_WIDTH = 132;
const ITEM_HEIGHT = 34;
const BAR_WIDTH = 180;
const BAR_HEIGHT = 46;
const ICON_UNIT_SIZE = 30;
const ICON_UNIT_GAP = 3;
const OVERFLOW_WIDTH = 42;
const OVERFLOW_HEIGHT = 24;

const COLOR_TEXT = "#f4efe4";
const COLOR_VALUE = "#fff4d1";
const COLOR_MUTED = "#a3a7ad";
const COLOR_TRACK = "#080b11";
const COLOR_TRACK_BORDER = "#6a6258";

const PLATE_ASSET = "assets/stats/stat-plate.svg";
const PLATE_MUTED_ASSET = "assets/stats/stat-plate-muted.svg";
const UNIT_ASSET = "assets/stats/stat-unit.svg";
const UNIT_MUTED_ASSET = "assets/stats/stat-unit-muted.svg";

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

function absoluteAssetUrl(path: string | undefined): string | undefined {
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

  const width = rows.reduce((max, row) => Math.max(max, row.width), 0);
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
  const tokenGap = TOKEN_GAP * scale;
  const groupGap = AUDIENCE_GAP * scale;
  let cursor = position === "top" ? bounds.min.y - tokenGap : bounds.max.y + tokenGap;

  for (const audience of audiences) {
    if (!audience.layout) continue;
    const x = bounds.center.x - audience.layout.width / 2;
    const y = position === "top" ? cursor - audience.layout.height : cursor;
    result.set(audience.visibility, { x, y });
    cursor = position === "top" ? y - groupGap : y + audience.layout.height + groupGap;
  }
  return result;
}

function elementMetadata(metadata: StatOverlayObrMetadata, element: string) {
  return { [STAT_OVERLAY_METADATA_KEY]: { ...metadata, element } };
}

function imageFrame(
  ctx: RenderContext,
  id: string,
  assetPath: string,
  logicalWidth: number,
  logicalHeight: number,
  position: Vector2,
  width: number,
  height: number,
): Item {
  const url = absoluteAssetUrl(assetPath) ?? assetPath;
  return buildImage(
    { width: logicalWidth, height: logicalHeight, url, mime: "image/svg+xml" },
    { dpi: logicalWidth, offset: { x: logicalWidth / 2, y: logicalHeight / 2 } },
  )
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .position({ x: position.x + width / 2, y: position.y + height / 2 })
    .rotation(0)
    .scale({
      x: width / ctx.sceneDpi,
      y: (height * logicalWidth) / (logicalHeight * ctx.sceneDpi),
    })
    .layer("ATTACHMENT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function plateItem(
  ctx: RenderContext,
  id: string,
  position: Vector2,
  width: number,
  height: number,
  muted = false,
): Item {
  return imageFrame(ctx, id, muted ? PLATE_MUTED_ASSET : PLATE_ASSET, 320, 96, position, width, height);
}

function unitFrameItem(
  ctx: RenderContext,
  id: string,
  position: Vector2,
  size: number,
  muted = false,
): Item {
  return imageFrame(ctx, id, muted ? UNIT_MUTED_ASSET : UNIT_ASSET, 96, 96, position, size, size);
}

function labelItem(
  ctx: RenderContext,
  id: string,
  value: string,
  position: Vector2,
  width: number,
  height: number,
  fontSize: number,
  color = COLOR_TEXT,
  weight = 600,
  align: TextAlign = "LEFT",
): Item {
  return buildLabel()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .plainText(value)
    .width(Math.max(1, width))
    .height(Math.max(1, height))
    .fontSize(Math.max(8, fontSize))
    .fontWeight(weight)
    .lineHeight(1)
    .padding(0)
    .textAlign(align)
    .textAlignVertical("MIDDLE")
    .fillColor(color)
    .backgroundOpacity(0)
    .position(position)
    .rotation(0)
    .layer("TEXT")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function iconItem(
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
    .layer("NOTE")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function detailShape(
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
    .position({ x: position.x + width / 2, y: position.y + height / 2 })
    .rotation(0)
    .layer("NOTE")
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
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

function valueOrToggleItems(
  ctx: RenderContext,
  item: StatTokenSyncItem,
  cell: DockCell,
  origin: Vector2,
): Item[] {
  const s = ctx.scale;
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-${sanitizeId(item.id)}`;
  const active = item.mode !== "toggle" || item.enabled === true;
  const result: Item[] = [plateItem(ctx, `${baseId}-plate`, { x, y }, cell.width, cell.height, !active)];

  const iconSize = 25 * s;
  const icon = iconItem(
    ctx,
    `${baseId}-icon`,
    item,
    { x: x + 18 * s, y: y + cell.height / 2 },
    iconSize,
  );
  if (icon) result.push(icon);

  if (!active) {
    result.push(detailShape(
      ctx,
      `${baseId}-mute`,
      { x: x + 7 * s, y: y + 6 * s },
      22 * s,
      22 * s,
      "#7c7f84",
      0.55,
    ));
  }

  const textX = x + 35 * s;
  const textY = y + 3 * s;
  const textHeight = cell.height - 6 * s;

  if (item.mode === "toggle") {
    result.push(labelItem(
      ctx,
      `${baseId}-name`,
      shortName(item.name, 16),
      { x: textX, y: textY },
      cell.width - 42 * s,
      textHeight,
      15 * s,
      active ? COLOR_TEXT : COLOR_MUTED,
      active ? 700 : 580,
    ));
    return result;
  }

  const valueWidth = 30 * s;
  const nameWidth = Math.max(12 * s, cell.width - 43 * s - valueWidth);
  result.push(
    labelItem(
      ctx,
      `${baseId}-name`,
      shortName(item.name),
      { x: textX, y: textY },
      nameWidth,
      textHeight,
      13.5 * s,
      COLOR_TEXT,
      620,
    ),
    labelItem(
      ctx,
      `${baseId}-value`,
      displayValue(item),
      { x: x + cell.width - valueWidth - 7 * s, y: textY },
      valueWidth,
      textHeight,
      17 * s,
      COLOR_VALUE,
      800,
      "RIGHT",
    ),
  );
  return result;
}

function barItems(
  ctx: RenderContext,
  item: StatTokenSyncItem,
  cell: DockCell,
  origin: Vector2,
): Item[] {
  const s = ctx.scale;
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-${sanitizeId(item.id)}`;
  const result: Item[] = [plateItem(ctx, `${baseId}-plate`, { x, y }, cell.width, cell.height)];

  const icon = iconItem(
    ctx,
    `${baseId}-icon`,
    item,
    { x: x + 21 * s, y: y + cell.height / 2 },
    31 * s,
  );
  if (icon) result.push(icon);

  const contentX = x + 42 * s;
  const contentWidth = cell.width - 49 * s;
  result.push(
    labelItem(
      ctx,
      `${baseId}-name`,
      shortName(item.name, 15),
      { x: contentX, y: y + 1 * s },
      Math.max(14 * s, contentWidth - 45 * s),
      18 * s,
      13.5 * s,
      COLOR_TEXT,
      650,
    ),
    labelItem(
      ctx,
      `${baseId}-value`,
      displayValue(item),
      { x: x + cell.width - 46 * s, y: y + 1 * s },
      39 * s,
      18 * s,
      16.5 * s,
      COLOR_VALUE,
      800,
      "RIGHT",
    ),
  );

  const trackX = contentX;
  const trackY = y + 27 * s;
  const trackWidth = Math.max(28 * s, contentWidth - 2 * s);
  const trackHeight = 8 * s;
  const max = Math.max(0, item.max ?? 0);
  const current = Math.max(0, item.current ?? 0);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;

  result.push(detailShape(
    ctx,
    `${baseId}-track`,
    { x: trackX, y: trackY },
    trackWidth,
    trackHeight,
    COLOR_TRACK,
    0.98,
    COLOR_TRACK_BORDER,
    0.95,
    Math.max(0.8, 1.1 * s),
  ));

  if (ratio > 0) {
    result.push(detailShape(
      ctx,
      `${baseId}-fill`,
      { x: trackX + 1.2 * s, y: trackY + 1.2 * s },
      Math.max(1.5 * s, (trackWidth - 2.4 * s) * ratio),
      trackHeight - 2.4 * s,
      item.accentColor,
      0.98,
    ));
  }

  return result;
}

function iconUnitItems(
  ctx: RenderContext,
  item: StatTokenSyncItem,
  cell: DockCell,
  origin: Vector2,
): Item[] {
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
    const unitId = `${baseId}-unit-${index}`;
    result.push(unitFrameItem(ctx, `${unitId}-frame`, { x, y }, size, !active));
    const icon = iconItem(
      ctx,
      `${unitId}-icon`,
      item,
      { x: x + size / 2, y: y + size / 2 },
      size * 0.68,
    );
    if (icon) result.push(icon);
    if (!active) {
      result.push(detailShape(
        ctx,
        `${unitId}-mute`,
        { x: x + size * 0.17, y: y + size * 0.17 },
        size * 0.66,
        size * 0.66,
        "#85888e",
        0.58,
      ));
    }
  }
  return result;
}

function overflowItems(ctx: RenderContext, cell: DockCell, origin: Vector2): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-overflow`;
  return [
    plateItem(ctx, `${baseId}-plate`, { x, y }, cell.width, cell.height, true),
    labelItem(
      ctx,
      `${baseId}-text`,
      `+${cell.overflowCount ?? 0}`,
      { x, y },
      cell.width,
      cell.height,
      14 * ctx.scale,
      COLOR_MUTED,
      800,
      "CENTER",
    ),
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

export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
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
    await preloadStatPngAssets();

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
      const desired = origin
        ? audienceItems(token, sourceItemId, audience, origin, scale, sceneDpi)
        : [];
      const result = await replaceAudienceItems(token, audience.visibility, desired);
      created += result.created;
      deleted += result.deleted;
    }

    const counts = Object.fromEntries(
      audiences.map(({ visibility, payload }) => [visibility, payload.itemCount]),
    ) as Record<StatTrackerVisibility, number>;
    const message = `Public ${counts.public} · Privé ${counts.private} · MJ ${counts.gm}`;

    if (created > 0) {
      return createResult(
        action,
        deleted > 0 ? "updated" : "created",
        `Stat Dock mis à jour · ${message}`,
        { sourceItemId },
      );
    }
    if (deleted > 0) {
      return createResult(action, "updated", `Stat Dock retiré · ${message}`, { sourceItemId });
    }
    return createResult(action, "not-ready", "Aucun tracker activé pour affichage token.", { sourceItemId });
  } catch (error) {
    return createResult(
      action,
      "error",
      error instanceof Error ? error.message : "Erreur Owlbear pendant la mise à jour.",
      { sourceItemId },
    );
  }
}

export async function deleteTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "delete";
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
  if (!canUseDockOverlaySync()) {
    return createResult(action, "unavailable", "Owlbear indisponible ou scène non prête.", { sourceItemId });
  }
  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult(action, "unavailable", "Action réservée au MJ.", { sourceItemId });
  }

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
    return createResult(
      action,
      "error",
      error instanceof Error ? error.message : "Erreur Owlbear pendant la suppression.",
      { sourceItemId },
    );
  }
}
