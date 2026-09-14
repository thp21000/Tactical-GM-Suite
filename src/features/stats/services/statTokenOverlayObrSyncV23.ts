import OBR, {
  buildImage,
  buildShape,
  buildText,
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
import {
  getStatRoomSettings,
  type StatTokenDockPosition,
} from "./statRoomSettings";
import {
  createTokenSyncPayloadForVisibility,
  type StatTokenSyncItem,
  type StatTokenSyncPayload,
} from "./statTokenSync";
import {
  grayscaleImageUrl,
  roundedBarItems,
  type V22Box,
} from "./statTokenOverlayObrV22Visuals";

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
  "addItems" | "deleteItems" | "getItems"
>;

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

type IconSourceDimensions = {
  width: number;
  height: number;
};

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const MAX_TRACKERS = 6;

const DEFAULT_ICON_SOURCE_DIMENSIONS: IconSourceDimensions = {
  width: 1254,
  height: 1254,
};

const ICON_SOURCE_DIMENSIONS: Record<string, IconSourceDimensions> = {
  arcane_portal: { width: 1024, height: 1024 },
  object_arrow_up: { width: 1246, height: 1262 },
  resource_platinum: { width: 1024, height: 1024 },
};

// V23 reste atomique : aucun ancien renderer n'est créé avant le rendu final.
// En 0.3.65 les cadres dynamiques utilisent des items Owlbear natifs plutôt
// que des data: SVG, car ces derniers deviennent des placeholders "Image".
const TOKEN_GAP = 4.5;
const AUDIENCE_GAP = 1;
const ITEM_GAP = 2.5;
const ROW_GAP = 2.5;
const ITEM_HEIGHT = 40;
const BAR_HEIGHT = 56;
const ICON_UNIT_SIZE = 34;
const ICON_UNIT_GAP = 4;
const OVERFLOW_WIDTH = 48;
const OVERFLOW_HEIGHT = 28;

const VALUE_ICON_SLOT = 41;
const BAR_ICON_SLOT = 53;
const VALUE_RIGHT_PADDING = 9;
const BAR_RIGHT_PADDING = 10;
const TEXT_GAP = 8;
const MIN_VALUE_CONTENT_WIDTH = 34;
const MIN_TOGGLE_CONTENT_WIDTH = 42;
const MIN_BAR_CONTENT_WIDTH = 76;
const MIN_VALUE_TEXT_WIDTH = 34;
const MIN_BAR_VALUE_TEXT_WIDTH = 52;

const FONT_FAMILY = "Georgia";
const COLOR_TEXT = "#f5efe3";
const COLOR_VALUE = "#fff0cf";
const COLOR_MUTED = "#aaacb1";

const PLATE_ASSET = "assets/stats/stat-plate.svg?v=0.3.65";
const PLATE_MUTED_ASSET = "assets/stats/stat-plate-muted.svg?v=0.3.65";

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

function safeAccentColor(color: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#4fb5ff";
}

function getIconSourceDimensions(iconId: string): IconSourceDimensions {
  return ICON_SOURCE_DIMENSIONS[iconId] ?? DEFAULT_ICON_SOURCE_DIMENSIONS;
}

function tokenScale(bounds: BoundingBox, sceneDpi: number): number {
  const diameter = Math.max(bounds.width, bounds.height);
  if (!Number.isFinite(diameter) || !Number.isFinite(sceneDpi) || sceneDpi <= 0) {
    return 1;
  }
  return Math.max(0.25, diameter / sceneDpi);
}

function iconUnitCount(item: StatTokenSyncItem): number {
  return Math.min(6, Math.max(1, Math.round(item.max ?? 1)));
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

function estimatedTextWidth(value: string, fontSize: number): number {
  const units = Array.from(value).reduce((width, character) => {
    if (/\s/u.test(character)) return width + 0.32;
    if (/[MW@%]/u.test(character)) return width + 0.86;
    if (/[ilI1|.,:;!'`]/u.test(character)) return width + 0.3;
    if (/[A-ZÀ-ÖØ-Þ]/u.test(character)) return width + 0.66;
    if (/[0-9]/u.test(character)) return width + 0.56;
    return width + 0.54;
  }, 0);
  return Math.ceil(units * fontSize * 1.08);
}

function valueTextWidth(item: StatTokenSyncItem, fontSize: number): number {
  const minimum = item.mode === "bar"
    ? MIN_BAR_VALUE_TEXT_WIDTH
    : MIN_VALUE_TEXT_WIDTH;
  return Math.max(minimum, estimatedTextWidth(displayValue(item), fontSize));
}

function cellSize(item: StatTokenSyncItem, scale: number) {
  if (item.mode === "bar") {
    const nameWidth = estimatedTextWidth(shortName(item.name, 16), 18);
    const valueWidth = valueTextWidth(item, 18);
    const contentWidth = Math.max(
      MIN_BAR_CONTENT_WIDTH,
      nameWidth + TEXT_GAP + valueWidth,
    );
    return {
      width: (BAR_ICON_SLOT + contentWidth + BAR_RIGHT_PADDING) * scale,
      height: BAR_HEIGHT * scale,
    };
  }

  if (item.mode === "icon") {
    const units = iconUnitCount(item);
    return {
      width: (units * ICON_UNIT_SIZE + (units - 1) * ICON_UNIT_GAP) * scale,
      height: ICON_UNIT_SIZE * scale,
    };
  }

  const name = shortName(item.name, item.mode === "toggle" ? 16 : 11);
  const nameFontSize = 17;
  const nameWidth = estimatedTextWidth(name, nameFontSize);
  const valueWidth = item.mode === "toggle"
    ? 0
    : valueTextWidth(item, 20);
  const contentWidth = item.mode === "toggle"
    ? Math.max(MIN_TOGGLE_CONTENT_WIDTH, nameWidth)
    : Math.max(MIN_VALUE_CONTENT_WIDTH, nameWidth + TEXT_GAP + valueWidth);

  return {
    width: (VALUE_ICON_SLOT + contentWidth + VALUE_RIGHT_PADDING) * scale,
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
      rows.push({
        cells: [{ kind: "tracker", item, x: 0, y: 0, ...size }],
        ...size,
      });
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
    row.cells.forEach((cell) => cells.push({
      ...cell,
      x: offsetX + cell.x,
      y,
    }));
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
  if (!payload.sourceItemId || payload.status !== "ready") {
    return { visibility, payload };
  }
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
  let cursor = position === "top"
    ? bounds.min.y - tokenGap
    : bounds.max.y + tokenGap;

  for (const audience of audiences) {
    if (!audience.layout) continue;
    const x = bounds.center.x - audience.layout.width / 2;
    const y = position === "top"
      ? cursor - audience.layout.height
      : cursor;
    result.set(audience.visibility, { x, y });
    cursor = position === "top"
      ? y - groupGap
      : y + audience.layout.height + groupGap;
  }
  return result;
}

function elementMetadata(metadata: StatOverlayObrMetadata, element: string) {
  return { [STAT_OVERLAY_METADATA_KEY]: { ...metadata, element } };
}

function imageFrame(
  ctx: RenderContext,
  id: string,
  url: string,
  mime: string,
  logicalWidth: number,
  logicalHeight: number,
  position: Vector2,
  width: number,
  height: number,
  zIndex: number,
): Item {
  return buildImage(
    { width: logicalWidth, height: logicalHeight, url, mime },
    {
      dpi: logicalWidth,
      offset: { x: logicalWidth / 2, y: logicalHeight / 2 },
    },
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
    .zIndex(zIndex)
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function nativeFrameItem(
  ctx: RenderContext,
  id: string,
  position: Vector2,
  width: number,
  height: number,
  fillColor: string,
  fillOpacity: number,
  strokeColor: string,
  strokeOpacity: number,
  strokeWidth: number,
  zIndex: number,
): Item {
  return buildShape()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .width(Math.max(0.5, width))
    .height(Math.max(0.5, height))
    .shapeType("RECTANGLE")
    .fillColor(fillColor)
    .fillOpacity(fillOpacity)
    .strokeColor(strokeColor)
    .strokeOpacity(strokeOpacity)
    .strokeWidth(Math.max(0, strokeWidth))
    .position({ x: position.x + width / 2, y: position.y + height / 2 })
    .rotation(0)
    .layer("ATTACHMENT")
    .zIndex(zIndex)
    .attachedTo(ctx.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(ctx.metadata, id))
    .build();
}

function plateItem(
  ctx: RenderContext,
  id: string,
  item: StatTokenSyncItem | undefined,
  position: Vector2,
  width: number,
  height: number,
  muted = false,
): Item {
  const toggleInactive = item?.mode === "toggle" && item.enabled !== true;
  const asset = muted || toggleInactive ? PLATE_MUTED_ASSET : PLATE_ASSET;
  const url = absoluteAssetUrl(asset) ?? asset;
  return imageFrame(
    ctx,
    id,
    url,
    "image/svg+xml",
    320,
    96,
    position,
    width,
    height,
    -30,
  );
}

function unitFrameItem(
  ctx: RenderContext,
  id: string,
  item: StatTokenSyncItem,
  position: Vector2,
  size: number,
  active: boolean,
): Item {
  const accent = safeAccentColor(item.accentColor);
  return nativeFrameItem(
    ctx,
    id,
    position,
    size,
    size,
    active ? "#0a1016" : "#242a31",
    0.96,
    active ? accent : "#69717b",
    active ? 0.98 : 0.78,
    Math.max(0.9, 1.7 * ctx.scale),
    -30,
  );
}

function textItem(
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
  return buildText()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .textType("PLAIN")
    .plainText(value)
    .width(Math.max(1, width))
    .height(Math.max(1, height))
    .fontFamily(FONT_FAMILY)
    .fontSize(Math.max(8, fontSize))
    .fontWeight(weight)
    .lineHeight(1)
    .padding(0)
    .textAlign(align)
    .textAlignVertical("MIDDLE")
    .fillColor(color)
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

function iconItem(
  ctx: RenderContext,
  id: string,
  item: StatTokenSyncItem,
  center: Vector2,
  size: number,
  active = true,
): Item | null {
  const sourceUrl = absoluteAssetUrl(item.iconSrc);
  if (!sourceUrl) return null;
  const sourceDimensions = getIconSourceDimensions(item.iconId);
  const sourceDpi = Math.max(sourceDimensions.width, sourceDimensions.height);
  const imageScale = size / ctx.sceneDpi;
  const url = active
    ? sourceUrl
    : grayscaleImageUrl(sourceUrl, sourceDimensions.width, sourceDimensions.height);

  return buildImage(
    {
      width: sourceDimensions.width,
      height: sourceDimensions.height,
      url,
      mime: "image/png",
    },
    {
      dpi: sourceDpi,
      offset: {
        x: sourceDimensions.width / 2,
        y: sourceDimensions.height / 2,
      },
    },
  )
    .id(id)
    .name(`Stats Dock — ${ctx.token.name} — ${item.name}`)
    .position(center)
    .rotation(0)
    .scale({ x: imageScale, y: imageScale })
    .layer("ATTACHMENT")
    .zIndex(-10)
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
  active = true,
): Item[] {
  const icon = iconItem(
    ctx,
    `${baseId}-icon`,
    item,
    { x: position.x + size / 2, y: position.y + size / 2 },
    size * (item.mode === "bar" ? 0.84 : 0.86),
    active,
  );
  return icon ? [icon] : [];
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
  const result: Item[] = [
    plateItem(ctx, `${baseId}-plate`, item, { x, y }, cell.width, cell.height),
  ];

  if (item.mode === "toggle" && active) {
    const inset = 3.5 * s;
    result.push(
      nativeFrameItem(
        ctx,
        `${baseId}-accent`,
        { x: x + inset, y: y + inset },
        Math.max(1, cell.width - inset * 2),
        Math.max(1, cell.height - inset * 2),
        "#000000",
        0,
        safeAccentColor(item.accentColor),
        0.72,
        Math.max(0.8, 1.2 * s),
        -22,
      ),
    );
  }

  const tileSize = 31 * s;
  const tilePos = {
    x: x + 5 * s,
    y: y + (cell.height - tileSize) / 2,
  };
  result.push(...iconTile(ctx, baseId, item, tilePos, tileSize, active));

  const textX = x + VALUE_ICON_SLOT * s;
  const textHeight = 23 * s;
  const textY = y + (cell.height - textHeight) / 2;

  if (item.mode === "toggle") {
    result.push(
      textItem(
        ctx,
        `${baseId}-name`,
        shortName(item.name, 16),
        { x: textX, y: textY },
        cell.width - (VALUE_ICON_SLOT + VALUE_RIGHT_PADDING) * s,
        textHeight,
        17 * s,
        active ? COLOR_TEXT : COLOR_MUTED,
        active ? 700 : 580,
      ),
    );
    return result;
  }

  const value = displayValue(item);
  const valueWidth = valueTextWidth(item, 20) * s;
  const valueX = x + cell.width - VALUE_RIGHT_PADDING * s - valueWidth;
  const nameWidth = Math.max(12 * s, valueX - TEXT_GAP * s - textX);
  result.push(
    textItem(
      ctx,
      `${baseId}-name`,
      shortName(item.name),
      { x: textX, y: textY },
      nameWidth,
      textHeight,
      17 * s,
      COLOR_TEXT,
      650,
    ),
    textItem(
      ctx,
      `${baseId}-value`,
      value,
      { x: valueX, y: textY },
      valueWidth,
      textHeight,
      20 * s,
      COLOR_VALUE,
      760,
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
  const result: Item[] = [
    plateItem(ctx, `${baseId}-plate`, item, { x, y }, cell.width, cell.height),
  ];

  const tileSize = 38 * s;
  const tilePos = {
    x: x + 7 * s,
    y: y + (cell.height - tileSize) / 2,
  };
  result.push(...iconTile(ctx, baseId, item, tilePos, tileSize, true));

  const contentX = x + BAR_ICON_SLOT * s;
  const value = displayValue(item);
  const valueWidth = valueTextWidth(item, 18) * s;
  const valueX = x + cell.width - BAR_RIGHT_PADDING * s - valueWidth;
  const nameWidth = Math.max(14 * s, valueX - TEXT_GAP * s - contentX);
  const textHeight = 22 * s;
  const textY = y + 5.5 * s;

  result.push(
    textItem(
      ctx,
      `${baseId}-name`,
      shortName(item.name, 16),
      { x: contentX, y: textY },
      nameWidth,
      textHeight,
      18 * s,
      COLOR_TEXT,
      650,
    ),
    textItem(
      ctx,
      `${baseId}-value`,
      value,
      { x: valueX, y: textY },
      valueWidth,
      textHeight,
      18 * s,
      COLOR_VALUE,
      760,
      "RIGHT",
    ),
  );

  const target: V22Box = {
    minX: x,
    minY: y,
    width: cell.width,
    height: cell.height,
  };
  result.push(
    ...roundedBarItems(
      ctx.token,
      ctx.sourceItemId,
      ctx.metadata,
      baseId,
      item,
      target,
      ctx.sceneDpi,
      s,
    ),
  );
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
    result.push(
      unitFrameItem(ctx, `${unitId}-frame`, item, { x, y }, size, active),
    );
    const icon = iconItem(
      ctx,
      `${unitId}-icon`,
      item,
      { x: x + size / 2, y: y + size / 2 },
      size * 0.76,
      active,
    );
    if (icon) result.push(icon);
  }
  return result;
}

function overflowItems(
  ctx: RenderContext,
  cell: DockCell,
  origin: Vector2,
): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${ctx.metadata.overlayId}-overflow`;
  return [
    plateItem(
      ctx,
      `${baseId}-plate`,
      undefined,
      { x, y },
      cell.width,
      cell.height,
      true,
    ),
    textItem(
      ctx,
      `${baseId}-text`,
      `+${cell.overflowCount ?? 0}`,
      { x, y },
      cell.width,
      cell.height,
      16 * ctx.scale,
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
  const ctx: RenderContext = {
    token,
    sourceItemId,
    metadata: audience.metadata,
    scale,
    sceneDpi,
  };
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
  if (existing.length > 0) {
    await api.deleteItems(existing.map(({ item }) => item.id));
  }
  if (desired.length > 0) await api.addItems(desired);
  return { created: desired.length, deleted: existing.length };
}

export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "create-or-update";
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) {
    return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
  }
  if (!canUseDockOverlaySync()) {
    return createResult(
      action,
      "unavailable",
      "Owlbear indisponible ou scène non prête.",
      { sourceItemId },
    );
  }
  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult(
      action,
      "unavailable",
      "Action réservée au MJ.",
      { sourceItemId },
    );
  }

  try {
    const [bounds, sceneDpi, settings] = await Promise.all([
      OBR.scene.items.getItemBounds([sourceItemId]),
      OBR.scene.grid.getDpi(),
      getStatRoomSettings(),
    ]);
    const scale = tokenScale(bounds, sceneDpi);
    const audiences = AUDIENCES.map((visibility) =>
      prepareAudience(token, visibility, scale),
    );
    const origins = audienceOrigins(
      bounds,
      audiences,
      settings.tokenStatsPosition,
      scale,
    );
    let created = 0;
    let deleted = 0;

    for (const audience of audiences) {
      const origin = origins.get(audience.visibility);
      const desired = origin
        ? audienceItems(
            token,
            sourceItemId,
            audience,
            origin,
            scale,
            sceneDpi,
          )
        : [];
      const result = await replaceAudienceItems(
        token,
        audience.visibility,
        desired,
      );
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
      return createResult(
        action,
        "updated",
        `Stat Dock retiré · ${message}`,
        { sourceItemId },
      );
    }
    return createResult(
      action,
      "not-ready",
      "Aucun tracker activé pour affichage token.",
      { sourceItemId },
    );
  } catch (error) {
    return createResult(
      action,
      "error",
      error instanceof Error
        ? error.message
        : "Erreur Owlbear pendant la mise à jour.",
      { sourceItemId },
    );
  }
}

export async function deleteTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const action: StatOverlayObrManualAction = "delete";
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) {
    return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
  }
  if (!canUseDockOverlaySync()) {
    return createResult(
      action,
      "unavailable",
      "Owlbear indisponible ou scène non prête.",
      { sourceItemId },
    );
  }
  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult(
      action,
      "unavailable",
      "Action réservée au MJ.",
      { sourceItemId },
    );
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
      error instanceof Error
        ? error.message
        : "Erreur Owlbear pendant la suppression.",
      { sourceItemId },
    );
  }
}
