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

type OverlayItemsApi = Pick<
  typeof OBR.scene.items,
  "addItems" | "deleteItems" | "getItems"
>;

type DockCell = {
  item?: StatTokenSyncItem;
  kind: "tracker" | "overflow";
  overflowCount?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DockLayout = {
  cells: DockCell[];
  width: number;
  height: number;
  hiddenCount: number;
};

type PreparedAudience = {
  visibility: StatTrackerVisibility;
  payload: StatTokenSyncPayload;
  overlayId?: string;
  metadata?: StatOverlayObrMetadata;
  layout?: DockLayout;
};

const MAX_TRACKERS = 6;
const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const ICON_LOGICAL_SIZE = 1024;

// Dimensions de référence pour un token d'une case.
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

function canUseObrOverlaySync(): boolean {
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

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function toAbsoluteAssetUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function getTokenScale(bounds: BoundingBox, sceneDpi: number): number {
  const diameter = Math.max(bounds.width, bounds.height);
  if (!Number.isFinite(diameter) || !Number.isFinite(sceneDpi) || sceneDpi <= 0) return 1;
  return Math.max(0.25, diameter / sceneDpi);
}

function getIconUnitCount(item: StatTokenSyncItem): number {
  const max = Math.round(item.max ?? 1);
  return Math.min(6, Math.max(1, max));
}

function getCellSize(item: StatTokenSyncItem, scale: number): { width: number; height: number } {
  if (item.mode === "bar") return { width: BAR_WIDTH * scale, height: BAR_HEIGHT * scale };
  if (item.mode === "icon") {
    const units = getIconUnitCount(item);
    return {
      width: (units * ICON_UNIT_SIZE + Math.max(0, units - 1) * ICON_UNIT_GAP) * scale,
      height: ICON_UNIT_SIZE * scale,
    };
  }
  return {
    width: (item.mode === "toggle" ? TOGGLE_WIDTH : VALUE_WIDTH) * scale,
    height: ITEM_HEIGHT * scale,
  };
}

type DockRow = {
  cells: DockCell[];
  width: number;
  height: number;
};

function buildDockLayout(payload: StatTokenSyncPayload, scale: number): DockLayout {
  const visible = payload.items.slice(0, MAX_TRACKERS);
  const hiddenCount = Math.max(0, payload.items.length - visible.length);
  const rows: DockRow[] = [];
  let inline: StatTokenSyncItem[] = [];

  const flushInline = () => {
    if (inline.length === 0) return;
    const cells: DockCell[] = [];
    let width = 0;
    let height = 0;
    inline.forEach((item, index) => {
      const size = getCellSize(item, scale);
      const x = width + (index > 0 ? ITEM_GAP * scale : 0);
      if (index > 0) width += ITEM_GAP * scale;
      cells.push({ kind: "tracker", item, x, y: 0, ...size });
      width += size.width;
      height = Math.max(height, size.height);
    });
    rows.push({ cells, width, height });
    inline = [];
  };

  for (const item of visible) {
    if (item.mode === "bar" || item.mode === "icon") {
      flushInline();
      const size = getCellSize(item, scale);
      rows.push({
        cells: [{ kind: "tracker", item, x: 0, y: 0, ...size }],
        width: size.width,
        height: size.height,
      });
      continue;
    }
    inline.push(item);
    if (inline.length === 3) flushInline();
  }
  flushInline();

  if (hiddenCount > 0) {
    rows.push({
      cells: [{
        kind: "overflow",
        overflowCount: hiddenCount,
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
  let y = 0;
  const cells: DockCell[] = [];
  rows.forEach((row, rowIndex) => {
    const rowX = (width - row.width) / 2;
    for (const cell of row.cells) {
      cells.push({ ...cell, x: rowX + cell.x, y });
    }
    y += row.height;
    if (rowIndex < rows.length - 1) y += ROW_GAP * scale;
  });

  return { cells, width, height: y, hiddenCount };
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
    layout: buildDockLayout(payload, scale),
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

function getAudienceOrigins(
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

function metadataForElement(metadata: StatOverlayObrMetadata, element: string) {
  return {
    [STAT_OVERLAY_METADATA_KEY]: {
      ...metadata,
      element,
    },
  };
}

function commonName(token: StatTrackedToken, item: StatTokenSyncItem | undefined, role: string): string {
  return `Stats Dock — ${token.name} — ${item?.name ?? "overflow"} — ${role}`;
}

function buildPanel(
  token: StatTrackedToken,
  metadata: StatOverlayObrMetadata,
  id: string,
  position: Vector2,
  width: number,
  height: number,
  accent: string,
  active = true,
): Item {
  return buildShape()
    .id(id)
    .name(commonName(token, undefined, "panel"))
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
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(metadataForElement(metadata, id))
    .build();
}

function buildText(
  token: StatTrackedToken,
  metadata: StatOverlayObrMetadata,
  id: string,
  text: string,
  position: Vector2,
  fontSize: number,
  color = COLOR_TEXT,
  weight = 600,
): Item {
  return buildLabel()
    .id(id)
    .name(commonName(token, undefined, "text"))
    .plainText(text)
    .fontSize(Math.max(6, fontSize))
    .fontWeight(weight)
    .padding(0)
    .fillColor(color)
    .backgroundOpacity(0)
    .position(position)
    .rotation(0)
    .layer("ATTACHMENT")
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(metadataForElement(metadata, id))
    .build();
}

function buildIcon(
  token: StatTrackedToken,
  metadata: StatOverlayObrMetadata,
  id: string,
  item: StatTokenSyncItem,
  center: Vector2,
  size: number,
  sceneDpi: number,
): Item | null {
  const url = toAbsoluteAssetUrl(item.iconSrc);
  if (!url) return null;
  const imageScale = size / sceneDpi;
  return buildImage(
    {
      width: ICON_LOGICAL_SIZE,
      height: ICON_LOGICAL_SIZE,
      url,
      mime: "image/png",
    },
    {
      dpi: ICON_LOGICAL_SIZE,
      offset: { x: ICON_LOGICAL_SIZE / 2, y: ICON_LOGICAL_SIZE / 2 },
    },
  )
    .id(id)
    .name(commonName(token, item, "icon"))
    .position(center)
    .rotation(0)
    .scale({ x: imageScale, y: imageScale })
    .layer("ATTACHMENT")
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(metadataForElement(metadata, id))
    .build();
}

function shortName(value: string, max = 12): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function formatValue(item: StatTokenSyncItem): string {
  if (item.visualType === "counter" || item.visualType === "readonly") {
    return String(item.value ?? item.current ?? 0);
  }
  if (item.visualType === "bar") {
    return `${item.current ?? 0}/${item.max ?? 0}`;
  }
  return "";
}

function buildValueOrToggle(
  token: StatTrackedToken,
  metadata: StatOverlayObrMetadata,
  item: StatTokenSyncItem,
  cell: DockCell,
  origin: Vector2,
  scale: number,
  sceneDpi: number,
): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;
  const active = item.mode !== "toggle" || item.enabled === true;
  const iconSize = 21 * scale;
  const iconCenter = { x: x + 15 * scale, y: y + cell.height / 2 };
  const items: Item[] = [
    buildPanel(token, metadata, `${baseId}-panel`, { x, y }, cell.width, cell.height, item.accentColor, active),
  ];
  const icon = buildIcon(token, metadata, `${baseId}-icon`, item, iconCenter, iconSize, sceneDpi);
  if (icon) items.push(icon);

  if (!active) {
    items.push(
      buildShape()
        .id(`${baseId}-mute`)
        .name(commonName(token, item, "mute"))
        .width(iconSize)
        .height(iconSize)
        .shapeType("RECTANGLE")
        .fillColor("#8b8f99")
        .fillOpacity(0.58)
        .strokeOpacity(0)
        .position({ x: iconCenter.x - iconSize / 2, y: iconCenter.y - iconSize / 2 })
        .rotation(0)
        .layer("ATTACHMENT")
        .attachedTo(token.sourceItemId)
        .locked(true)
        .disableHit(true)
        .disableAutoZIndex(true)
        .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
        .metadata(metadataForElement(metadata, `${baseId}-mute`))
        .build(),
    );
  }

  const value = item.mode === "value" ? ` ${formatValue(item)}` : "";
  items.push(
    buildText(
      token,
      metadata,
      `${baseId}-text`,
      `${shortName(item.name)}${value}`,
      { x: x + 29 * scale, y: y + cell.height / 2 },
      10.5 * scale,
      active ? COLOR_TEXT : COLOR_MUTED,
      item.mode === "value" ? 650 : 600,
    ),
  );
  return items;
}

function buildBar(
  token: StatTrackedToken,
  metadata: StatOverlayObrMetadata,
  item: StatTokenSyncItem,
  cell: DockCell,
  origin: Vector2,
  scale: number,
  sceneDpi: number,
): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;
  const iconSize = 22 * scale;
  const iconCenter = { x: x + 15 * scale, y: y + 16 * scale };
  const items: Item[] = [
    buildPanel(token, metadata, `${baseId}-panel`, { x, y }, cell.width, cell.height, item.accentColor),
  ];
  const icon = buildIcon(token, metadata, `${baseId}-icon`, item, iconCenter, iconSize, sceneDpi);
  if (icon) items.push(icon);

  items.push(
    buildText(
      token,
      metadata,
      `${baseId}-name`,
      shortName(item.name, 13),
      { x: x + 30 * scale, y: y + 14 * scale },
      9.5 * scale,
      COLOR_TEXT,
      600,
    ),
    buildText(
      token,
      metadata,
      `${baseId}-value`,
      formatValue(item),
      { x: x + cell.width - 34 * scale, y: y + 14 * scale },
      10.5 * scale,
      COLOR_TEXT,
      700,
    ),
  );

  const trackX = x + 30 * scale;
  const trackY = y + 28 * scale;
  const trackWidth = Math.max(24 * scale, cell.width - 38 * scale);
  const trackHeight = 5 * scale;
  const max = Math.max(0, item.max ?? 0);
  const current = Math.max(0, item.current ?? 0);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  items.push(
    buildShape()
      .id(`${baseId}-track`)
      .name(commonName(token, item, "track"))
      .width(trackWidth)
      .height(trackHeight)
      .shapeType("RECTANGLE")
      .fillColor(COLOR_TRACK)
      .fillOpacity(0.95)
      .strokeColor(COLOR_BORDER)
      .strokeOpacity(0.7)
      .strokeWidth(Math.max(0.8, scale))
      .position({ x: trackX, y: trackY })
      .rotation(0)
      .layer("ATTACHMENT")
      .attachedTo(token.sourceItemId)
      .locked(true)
      .disableHit(true)
      .disableAutoZIndex(true)
      .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
      .metadata(metadataForElement(metadata, `${baseId}-track`))
      .build(),
  );
  if (ratio > 0) {
    items.push(
      buildShape()
        .id(`${baseId}-fill`)
        .name(commonName(token, item, "fill"))
        .width(Math.max(1, trackWidth * ratio))
        .height(trackHeight)
        .shapeType("RECTANGLE")
        .fillColor(item.accentColor)
        .fillOpacity(0.96)
        .strokeOpacity(0)
        .position({ x: trackX, y: trackY })
        .rotation(0)
        .layer("ATTACHMENT")
        .attachedTo(token.sourceItemId)
        .locked(true)
        .disableHit(true)
        .disableAutoZIndex(true)
        .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
        .metadata(metadataForElement(metadata, `${baseId}-fill`))
        .build(),
    );
  }
  return items;
}

function buildIconUnits(
  token: StatTrackedToken,
  metadata: StatOverlayObrMetadata,
  item: StatTokenSyncItem,
  cell: DockCell,
  origin: Vector2,
  scale: number,
  sceneDpi: number,
): Item[] {
  const items: Item[] = [];
  const max = getIconUnitCount(item);
  const current = Math.min(max, Math.max(0, Math.round(item.current ?? 0)));
  const size = ICON_UNIT_SIZE * scale;
  const gap = ICON_UNIT_GAP * scale;
  const baseX = origin.x + cell.x;
  const y = origin.y + cell.y;
  const baseId = `${metadata.overlayId}-${sanitizeId(item.id)}`;

  for (let index = 0; index < max; index += 1) {
    const active = index < current;
    const x = baseX + index * (size + gap);
    const panelId = `${baseId}-unit-${index}-panel`;
    items.push(
      buildPanel(token, metadata, panelId, { x, y }, size, size, item.accentColor, active),
    );
    const icon = buildIcon(
      token,
      metadata,
      `${baseId}-unit-${index}-icon`,
      item,
      { x: x + size / 2, y: y + size / 2 },
      20 * scale,
      sceneDpi,
    );
    if (icon) items.push(icon);
    if (!active) {
      items.push(
        buildShape()
          .id(`${baseId}-unit-${index}-mute`)
          .name(commonName(token, item, "inactive-unit"))
          .width(size - 4 * scale)
          .height(size - 4 * scale)
          .shapeType("RECTANGLE")
          .fillColor("#777b84")
          .fillOpacity(0.65)
          .strokeOpacity(0)
          .position({ x: x + 2 * scale, y: y + 2 * scale })
          .rotation(0)
          .layer("ATTACHMENT")
          .attachedTo(token.sourceItemId)
          .locked(true)
          .disableHit(true)
          .disableAutoZIndex(true)
          .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
          .metadata(metadataForElement(metadata, `${baseId}-unit-${index}-mute`))
          .build(),
      );
    }
  }
  return items;
}

function buildOverflow(
  token: StatTrackedToken,
  metadata: StatOverlayObrMetadata,
  cell: DockCell,
  origin: Vector2,
  scale: number,
): Item[] {
  const x = origin.x + cell.x;
  const y = origin.y + cell.y;
  const id = `${metadata.overlayId}-overflow`;
  return [
    buildPanel(token, metadata, `${id}-panel`, { x, y }, cell.width, cell.height, COLOR_BORDER),
    buildText(
      token,
      metadata,
      `${id}-text`,
      `+${cell.overflowCount ?? 0}`,
      { x: x + cell.width / 2 - 6 * scale, y: y + cell.height / 2 },
      9.5 * scale,
      COLOR_MUTED,
      700,
    ),
  ];
}

function buildAudienceItems(
  token: StatTrackedToken,
  audience: PreparedAudience,
  origin: Vector2,
  scale: number,
  sceneDpi: number,
): Item[] {
  if (!audience.layout || !audience.metadata) return [];
  return audience.layout.cells.flatMap((cell) => {
    if (cell.kind === "overflow") return buildOverflow(token, audience.metadata!, cell, origin, scale);
    const item = cell.item;
    if (!item) return [];
    if (item.mode === "bar") return buildBar(token, audience.metadata!, item, cell, origin, scale, sceneDpi);
    if (item.mode === "icon") return buildIconUnits(token, audience.metadata!, item, cell, origin, scale, sceneDpi);
    return buildValueOrToggle(token, audience.metadata!, item, cell, origin, scale, sceneDpi);
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

export function canUseObrOverlaySync(): boolean {
  return canUseObrOverlaySync();
}

export async function findExistingStatsOverlay(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility = "public",
): Promise<StatOverlayObrExistingOverlay | undefined> {
  if (!canUseObrOverlaySync()) return undefined;
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
  if (!token.sourceItemId) return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
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
    const [bounds, sceneDpi, settings] = await Promise.all([
      OBR.scene.items.getItemBounds([token.sourceItemId]),
      OBR.scene.grid.getDpi(),
      getStatRoomSettings(),
    ]);
    const scale = getTokenScale(bounds, sceneDpi);
    const audiences = AUDIENCES.map((visibility) => prepareAudience(token, visibility, scale));
    const origins = getAudienceOrigins(bounds, audiences, settings.tokenStatsPosition, scale);
    let created = 0;
    let deleted = 0;

    for (const audience of audiences) {
      const origin = origins.get(audience.visibility);
      const desired = origin
        ? buildAudienceItems(token, audience, origin, scale, sceneDpi)
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
      return createResult(action, deleted > 0 ? "updated" : "created", `Stat Dock mis à jour · ${message}`, {
        sourceItemId: token.sourceItemId,
      });
    }
    if (deleted > 0) {
      return createResult(action, "updated", `Stat Dock retiré · ${message}`, {
        sourceItemId: token.sourceItemId,
      });
    }
    return createResult(action, "not-ready", "Aucun tracker activé pour affichage token.", {
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
  if (!token.sourceItemId) return createResult(action, "not-ready", "Token non lié à un item Owlbear.");
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
    let deleted = 0;
    for (const visibility of AUDIENCES) {
      const api = getAudienceApi(visibility);
      const overlays = await findOverlays(token, visibility);
      if (overlays.length === 0) continue;
      await api.deleteItems(overlays.map(({ item }) => item.id));
      deleted += overlays.length;
    }
    return createResult(
      action,
      deleted > 0 ? "deleted" : "not-found",
      deleted > 0 ? "Stat Dock supprimé." : "Aucun Stat Dock trouvé.",
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
