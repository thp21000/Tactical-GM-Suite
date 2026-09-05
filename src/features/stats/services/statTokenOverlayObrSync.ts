import OBR, {
  buildImage,
  buildLabel,
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

type DockLayout = {
  cells: DockCell[];
  width: number;
  height: number;
};

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

type TextAlign = "LEFT" | "CENTER" | "RIGHT";

type Row = {
  cells: DockCell[];
  width: number;
  height: number;
};

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const MAX_TRACKERS = 6;
const ICON_LOGICAL_SIZE = 1024;

// Dimensions de référence pour un token d'une case.
// La V1.1 réduit volontairement l'encombrement par rapport au premier prototype.
const TOKEN_GAP = 5;
const ITEM_GAP = 3;
const ROW_GAP = 3;
const VALUE_WIDTH = 78;
const TOGGLE_WIDTH = 94;
const ITEM_HEIGHT = 28;
const BAR_WIDTH = 142;
const BAR_HEIGHT = 40;
const ICON_UNIT_SIZE = 24;
const ICON_UNIT_GAP = 3;
const OVERFLOW_WIDTH = 30;
const OVERFLOW_HEIGHT = 18;

const COLOR_BACKGROUND = "#11151f";
const COLOR_BACKGROUND_INNER = "#181d29";
const COLOR_TEXT = "#f5f1e8";
const COLOR_VALUE = "#fff5df";
const COLOR_MUTED = "#8f96a3";
const COLOR_BRONZE = "#b58a52";
const COLOR_BRONZE_HIGHLIGHT = "#d6b273";
const COLOR_INACTIVE_FRAME = "#656b75";
const COLOR_TRACK = "#080a0f";
const COLOR_TRACK_BORDER = "#414754";
const COLOR_SHADOW = "#000000";

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
  if (!Number.isFinite(diameter) || !Number.isFinite(sceneDpi) || sceneDpi <= 0) {
    return 1;
  }
  return Math.max(0.25, diameter / sceneDpi);
}

function iconUnitCount(item: StatTokenSyncItem): number {
  return Math.min(6, Math.max(1, Math.round(item.max ?? 1)));
}

function cellSize(item: StatTokenSyncItem, scale: number) {
  if (item.mode === "bar") {
    return { width: BAR_WIDTH * scale, height: BAR_HEIGHT * scale };
  }
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
      const cell: DockCell = {
        kind: "tracker",
        item,
        x,
        y: 0,
        ...size,
      };
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
      continue;
    }

    inline.push(item);
    if (inline.length === 3) flushInline();
  }
  flushInline();

  if (hidden > 0) {
    rows.push({
      cells: [
        {
          kind: "overflow",
          overflowCount: hidden,
          x: 0,
          y: 0,
          width: OVERFLOW_WIDTH * scale,
          height: OVERFLOW_HEIGHT * scale,
        },
      ],
      width: OVERFLOW_WIDTH * scale,
      height: OVERFLOW_HEIGHT * scale,
    });
  }

  const width = rows.reduce((result, row) => Math.max(result, row.width), 0);
  const cells: DockCell[] = [];
  let y = 0;

  rows.forEach((row, rowIndex) => {
    const offsetX = (width - row.width) / 2;
    row.cells.forEach((cell) => {
      cells.push({ ...cell, x: offsetX + cell.x, y });
    });
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
  return {
    [STAT_OVERLAY_METADATA_KEY]: {
      ...metadata,
      element,
    },
  };
}

function roundedBlock(
  ctx: RenderContext,
  id: string,
  position: Vector2,
  width: number,
  height: number,
  backgroundColor: string,
  backgroundOpacity: number,
  cornerRadius: number,
): Item {
  return buildLabel()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .plainText("")
    .width(Math.max(1, width))
    .height(Math.max(1, height))
    .fontSize(1)
    .padding(0)
    .fillColor("#000000")
    .fillOpacity(0)
    .backgroundColor(backgroundColor)
    .backgroundOpacity(backgroundOpacity)
    .cornerRadius(Math.max(0, cornerRadius))
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
  return buildLabel()
    .id(id)
    .name(`Stats Dock — ${ctx.token.name}`)
    .plainText(value)
    .width(Math.max(1, width))
    .height(Math.max(1, height))
    .fontSize(Math.max(6, fontSize))
    .fontWeight(weight)
    .lineHeight(1)
    .padding(0)
    .textAlign(align)
    .textAlignVertical("MIDDLE")
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

function frameItems(
  ctx: RenderContext,
  baseId: string,
  position: Vector2,
  width: number,
  height: number,
  frameColor: string,
): Item[] {
  const s = ctx.scale;
  const inset = 1.35 * s;

  return [
    roundedBlock(
      ctx,
      `${baseId}-shadow`,
      { x: position.x + 1.3 * s, y: position.y + 1.8 * s },
      width,
      height,
      COLOR_SHADOW,
      0.42,
      7 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-frame`,
      position,
      width,
      height,
      frameColor,
      0.98,
      7 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-body`,
      { x: position.x + inset, y: position.y + inset },
      width - inset * 2,
      height - inset * 2,
      COLOR_BACKGROUND,
      0.98,
      5.8 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-inner`,
      { x: position.x + 2.5 * s, y: position.y + 2.5 * s },
      width - 5 * s,
      height - 5 * s,
      COLOR_BACKGROUND_INNER,
      0.62,
      4.8 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-highlight`,
      { x: position.x + 4 * s, y: position.y + 2.3 * s },
      Math.max(1, width - 8 * s),
      Math.max(0.7 * s, 0.7),
      COLOR_BRONZE_HIGHLIGHT,
      0.22,
      1 * s,
    ),
  ];
}

function iconPlateItems(
  ctx: RenderContext,
  baseId: string,
  position: Vector2,
  size: number,
  accent: string,
  active: boolean,
): Item[] {
  const s = ctx.scale;
  const outerColor = active ? accent : COLOR_INACTIVE_FRAME;

  return [
    roundedBlock(
      ctx,
      `${baseId}-icon-shadow`,
      { x: position.x + 0.7 * s, y: position.y + 1 * s },
      size,
      size,
      COLOR_SHADOW,
      0.35,
      6 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-icon-frame`,
      position,
      size,
      size,
      outerColor,
      active ? 0.92 : 0.78,
      6 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-icon-body`,
      { x: position.x + 1.25 * s, y: position.y + 1.25 * s },
      size - 2.5 * s,
      size - 2.5 * s,
      COLOR_BACKGROUND,
      active ? 0.92 : 0.98,
      4.8 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-icon-glow`,
      { x: position.x + 3 * s, y: position.y + 3 * s },
      size - 6 * s,
      size - 6 * s,
      active ? accent : "#555a64",
      active ? 0.17 : 0.1,
      4 * s,
    ),
  ];
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
    {
      width: ICON_LOGICAL_SIZE,
      height: ICON_LOGICAL_SIZE,
      url,
      mime: "image/png",
    },
    {
      dpi: ICON_LOGICAL_SIZE,
      offset: {
        x: ICON_LOGICAL_SIZE / 2,
        y: ICON_LOGICAL_SIZE / 2,
      },
    },
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

function shortName(value: string, max = 9): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function displayValue(item: StatTokenSyncItem): string {
  if (item.visualType === "counter" || item.visualType === "readonly") {
    return String(item.value ?? item.current ?? 0);
  }
  if (item.visualType === "bar") {
    return `${item.current ?? 0}/${item.max ?? 0}`;
  }
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
  const frameColor = item.mode === "toggle"
    ? active
      ? item.accentColor
      : COLOR_INACTIVE_FRAME
    : COLOR_BRONZE;
  const result: Item[] = frameItems(
    ctx,
    baseId,
    { x, y },
    cell.width,
    cell.height,
    frameColor,
  );

  const plateSize = 22 * s;
  const platePosition = {
    x: x + 3 * s,
    y: y + (cell.height - plateSize) / 2,
  };
  result.push(
    ...iconPlateItems(ctx, baseId, platePosition, plateSize, item.accentColor, active),
  );

  const icon = iconItem(
    ctx,
    `${baseId}-icon`,
    item,
    {
      x: platePosition.x + plateSize / 2,
      y: platePosition.y + plateSize / 2,
    },
    18 * s,
  );
  if (icon) result.push(icon);

  if (!active) {
    result.push(
      roundedBlock(
        ctx,
        `${baseId}-icon-mute`,
        { x: platePosition.x + 2 * s, y: platePosition.y + 2 * s },
        plateSize - 4 * s,
        plateSize - 4 * s,
        "#767b84",
        0.5,
        4 * s,
      ),
    );
  }

  const textX = x + 29 * s;
  const textY = y + 3 * s;
  const textHeight = cell.height - 6 * s;

  if (item.mode === "toggle") {
    result.push(
      textItem(
        ctx,
        `${baseId}-name`,
        shortName(item.name, 13),
        { x: textX, y: textY },
        Math.max(10 * s, cell.width - 33 * s),
        textHeight,
        9.2 * s,
        active ? COLOR_TEXT : COLOR_MUTED,
        active ? 650 : 550,
      ),
    );
    return result;
  }

  const valueWidth = 21 * s;
  const nameWidth = Math.max(10 * s, cell.width - 33 * s - valueWidth);
  result.push(
    textItem(
      ctx,
      `${baseId}-name`,
      shortName(item.name),
      { x: textX, y: textY },
      nameWidth,
      textHeight,
      8.2 * s,
      COLOR_TEXT,
      560,
    ),
    textItem(
      ctx,
      `${baseId}-value`,
      displayValue(item),
      { x: x + cell.width - valueWidth - 4 * s, y: textY },
      valueWidth,
      textHeight,
      10.6 * s,
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
  const result: Item[] = frameItems(
    ctx,
    baseId,
    { x, y },
    cell.width,
    cell.height,
    COLOR_BRONZE,
  );

  const plateSize = 29 * s;
  const platePosition = {
    x: x + 4 * s,
    y: y + (cell.height - plateSize) / 2,
  };
  result.push(
    ...iconPlateItems(ctx, baseId, platePosition, plateSize, item.accentColor, true),
  );

  const icon = iconItem(
    ctx,
    `${baseId}-icon`,
    item,
    {
      x: platePosition.x + plateSize / 2,
      y: platePosition.y + plateSize / 2,
    },
    23 * s,
  );
  if (icon) result.push(icon);

  const contentX = x + 38 * s;
  const topY = y + 4 * s;
  const contentWidth = cell.width - 43 * s;
  result.push(
    textItem(
      ctx,
      `${baseId}-name`,
      shortName(item.name, 14),
      { x: contentX, y: topY },
      Math.max(10 * s, contentWidth - 42 * s),
      14 * s,
      8.5 * s,
      COLOR_TEXT,
      600,
    ),
    textItem(
      ctx,
      `${baseId}-value`,
      displayValue(item),
      { x: x + cell.width - 43 * s, y: topY },
      38 * s,
      14 * s,
      10.2 * s,
      COLOR_VALUE,
      760,
      "RIGHT",
    ),
  );

  const trackX = contentX;
  const trackY = y + 24 * s;
  const trackWidth = Math.max(28 * s, contentWidth);
  const trackHeight = 8 * s;
  const max = Math.max(0, item.max ?? 0);
  const current = Math.max(0, item.current ?? 0);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  const innerX = trackX + 1.2 * s;
  const innerY = trackY + 1.2 * s;
  const innerWidth = trackWidth - 2.4 * s;
  const innerHeight = trackHeight - 2.4 * s;

  result.push(
    roundedBlock(
      ctx,
      `${baseId}-track-frame`,
      { x: trackX, y: trackY },
      trackWidth,
      trackHeight,
      COLOR_TRACK_BORDER,
      0.96,
      4 * s,
    ),
    roundedBlock(
      ctx,
      `${baseId}-track`,
      { x: innerX, y: innerY },
      innerWidth,
      innerHeight,
      COLOR_TRACK,
      1,
      3 * s,
    ),
  );

  if (ratio > 0) {
    const fillWidth = Math.max(1.5 * s, innerWidth * ratio);
    result.push(
      roundedBlock(
        ctx,
        `${baseId}-fill`,
        { x: innerX, y: innerY },
        fillWidth,
        innerHeight,
        item.accentColor,
        0.98,
        3 * s,
      ),
      roundedBlock(
        ctx,
        `${baseId}-fill-highlight`,
        { x: innerX + 1 * s, y: innerY + 0.8 * s },
        Math.max(1, fillWidth - 2 * s),
        Math.max(0.8, 1 * s),
        "#ffffff",
        0.22,
        1 * s,
      ),
    );
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

    result.push(
      ...frameItems(
        ctx,
        unitId,
        { x, y },
        size,
        size,
        active ? COLOR_BRONZE : COLOR_INACTIVE_FRAME,
      ),
    );

    const icon = iconItem(
      ctx,
      `${unitId}-icon`,
      item,
      { x: x + size / 2, y: y + size / 2 },
      18.5 * ctx.scale,
    );
    if (icon) result.push(icon);

    if (!active) {
      result.push(
        roundedBlock(
          ctx,
          `${unitId}-mute`,
          { x: x + 2.7 * ctx.scale, y: y + 2.7 * ctx.scale },
          size - 5.4 * ctx.scale,
          size - 5.4 * ctx.scale,
          "#737781",
          0.58,
          4 * ctx.scale,
        ),
      );
    }
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
  const result = frameItems(
    ctx,
    baseId,
    { x, y },
    cell.width,
    cell.height,
    COLOR_INACTIVE_FRAME,
  );

  result.push(
    textItem(
      ctx,
      `${baseId}-text`,
      `+${cell.overflowCount ?? 0}`,
      { x, y },
      cell.width,
      cell.height,
      8.5 * ctx.scale,
      COLOR_MUTED,
      760,
      "CENTER",
    ),
  );
  return result;
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
  if (desired.length > 0) {
    await api.addItems(desired);
  }

  return {
    created: desired.length,
    deleted: existing.length,
  };
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
    return createResult(action, "unavailable", "Action réservée au MJ.", {
      sourceItemId,
    });
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
        ? audienceItems(token, sourceItemId, audience, origin, scale, sceneDpi)
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
      return createResult(action, "updated", `Stat Dock retiré · ${message}`, {
        sourceItemId,
      });
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
    return createResult(action, "unavailable", "Action réservée au MJ.", {
      sourceItemId,
    });
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
