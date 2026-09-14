import OBR, { buildImage, type BoundingBox, type Item, type Vector2 } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken, StatTrackerVisibility } from "../statTypes";
import {
  STAT_OVERLAY_KIND,
  STAT_OVERLAY_METADATA_KEY,
  type StatOverlayObrMetadata,
} from "./statTokenOverlayObrAdapter";
import { createOverlayId } from "./statTokenOverlayPlan";
import { getStatRoomSettings } from "./statRoomSettings";
import {
  createTokenSyncPayloadForVisibility,
  type StatTokenSyncItem,
} from "./statTokenSync";
import {
  canUseObrOverlaySync,
  createOrUpdateTokenOverlay as createOrUpdateTokenOverlayV20,
  deleteTokenOverlay,
  findExistingStatsOverlay,
  type StatOverlayObrExistingOverlay,
  type StatOverlayObrManualAction,
  type StatOverlayObrSyncResult,
  type StatOverlayObrSyncStatus,
} from "./statTokenOverlayObrSyncV20";

export {
  canUseObrOverlaySync,
  deleteTokenOverlay,
  findExistingStatsOverlay,
};
export type {
  StatOverlayObrExistingOverlay,
  StatOverlayObrManualAction,
  StatOverlayObrSyncResult,
  StatOverlayObrSyncStatus,
};

type OverlayMutableApi = Pick<
  typeof OBR.scene.items,
  "getItems" | "addItems" | "deleteItems" | "updateItems"
>;

type Box = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

type TrackerGroup = {
  baseId: string;
  tracker?: StatTokenSyncItem;
  bounds: Box;
  memberIds: string[];
};

type AudienceModel = {
  visibility: StatTrackerVisibility;
  api: OverlayMutableApi;
  overlayId: string;
  metadata: StatOverlayObrMetadata;
  overlayItems: Item[];
  rows: TrackerGroup[][];
  trackerByBaseId: Map<string, StatTokenSyncItem>;
  movement: Map<string, Vector2>;
  targetBounds: Map<string, Box>;
};

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const MAX_TRACKERS = 6;

// V21 : densité réduite de moitié par rapport à V12.
const TOKEN_GAP = 4.5;
const AUDIENCE_GAP = 1;
const ITEM_GAP = 2.5;
const ROW_GAP = 2.5;

const VALUE_TEXT_HEIGHT = 23;
const BAR_TEXT_HEIGHT = 22;
const BAR_ICON_SLOT = 53;
const BAR_RIGHT_PADDING = 10;
const BAR_TRACK_Y = 34;
const BAR_TRACK_HEIGHT = 10;

const LEGACY_BAR_SUFFIXES = [
  "-track",
  "-track-highlight",
  "-track-shadow",
  "-fill-glow",
  "-fill",
  "-fill-shine",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function getAudienceApi(visibility: StatTrackerVisibility): OverlayMutableApi {
  return visibility === "public" ? OBR.scene.items : OBR.scene.local;
}

function readElement(
  item: Item,
  sourceItemId: string,
  visibility: StatTrackerVisibility,
): string | undefined {
  const metadata = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  if (!isRecord(metadata)) return undefined;
  if (
    metadata.kind !== STAT_OVERLAY_KIND ||
    metadata.sourceItemId !== sourceItemId ||
    metadata.visibility !== visibility ||
    typeof metadata.element !== "string"
  ) {
    return undefined;
  }
  return metadata.element;
}

function createMetadata(
  token: StatTrackedToken,
  sourceItemId: string,
  visibility: StatTrackerVisibility,
): StatOverlayObrMetadata {
  return {
    kind: STAT_OVERLAY_KIND,
    tokenId: token.id,
    sourceItemId,
    overlayId: createOverlayId(sourceItemId, visibility),
    updatedAt: token.updatedAt,
    visibility,
  };
}

function elementMetadata(metadata: StatOverlayObrMetadata, element: string) {
  return { [STAT_OVERLAY_METADATA_KEY]: { ...metadata, element } };
}

function tokenScale(bounds: BoundingBox, sceneDpi: number): number {
  const diameter = Math.max(bounds.width, bounds.height);
  if (!Number.isFinite(diameter) || !Number.isFinite(sceneDpi) || sceneDpi <= 0) return 1;
  return Math.max(0.25, diameter / sceneDpi);
}

function imageBounds(item: Item, sceneDpi: number): Box | undefined {
  if (item.type !== "IMAGE") return undefined;
  if (!Number.isFinite(item.grid.dpi) || item.grid.dpi <= 0) return undefined;

  const width =
    (item.image.width / item.grid.dpi) * sceneDpi * Math.abs(item.scale.x);
  const height =
    (item.image.height / item.grid.dpi) * sceneDpi * Math.abs(item.scale.y);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }

  return {
    minX: item.position.x - width / 2,
    minY: item.position.y - height / 2,
    maxX: item.position.x + width / 2,
    maxY: item.position.y + height / 2,
    width,
    height,
  };
}

function unionBoxes(boxes: Box[]): Box | undefined {
  if (boxes.length === 0) return undefined;
  const minX = Math.min(...boxes.map((box) => box.minX));
  const minY = Math.min(...boxes.map((box) => box.minY));
  const maxX = Math.max(...boxes.map((box) => box.maxX));
  const maxY = Math.max(...boxes.map((box) => box.maxY));
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function groupBounds(
  baseId: string,
  tracker: StatTokenSyncItem | undefined,
  items: Item[],
  elementById: Map<string, string>,
  sceneDpi: number,
): Box | undefined {
  if (tracker?.mode === "icon") {
    const frames = items.filter((item) => {
      const element = elementById.get(item.id);
      return Boolean(
        element &&
          element.startsWith(`${baseId}-unit-`) &&
          element.endsWith("-frame") &&
          item.type === "IMAGE",
      );
    });
    return unionBoxes(
      frames.flatMap((item) => {
        const box = imageBounds(item, sceneDpi);
        return box ? [box] : [];
      }),
    );
  }

  const plate = items.find((item) => elementById.get(item.id) === `${baseId}-plate`);
  return plate ? imageBounds(plate, sceneDpi) : undefined;
}

function makeGroup(
  baseId: string,
  tracker: StatTokenSyncItem | undefined,
  items: Item[],
  elementById: Map<string, string>,
  sceneDpi: number,
): TrackerGroup | undefined {
  const bounds = groupBounds(baseId, tracker, items, elementById, sceneDpi);
  if (!bounds) return undefined;

  const memberIds = items.flatMap((item) => {
    const element = elementById.get(item.id);
    return element && element.startsWith(`${baseId}-`) ? [item.id] : [];
  });

  return { baseId, tracker, bounds, memberIds };
}

function buildRows(
  overlayId: string,
  payloadItems: StatTokenSyncItem[],
  groups: Map<string, TrackerGroup>,
): TrackerGroup[][] {
  const rows: TrackerGroup[][] = [];
  let inline: TrackerGroup[] = [];

  const flushInline = () => {
    if (inline.length > 0) rows.push(inline);
    inline = [];
  };

  const visible = payloadItems.slice(0, MAX_TRACKERS);
  for (const tracker of visible) {
    const baseId = `${overlayId}-${sanitizeId(tracker.id)}`;
    const group = groups.get(baseId);
    if (!group) continue;

    if (tracker.mode === "bar" || tracker.mode === "icon") {
      flushInline();
      rows.push([group]);
      continue;
    }

    inline.push(group);
    if (inline.length === 3) flushInline();
  }
  flushInline();

  if (payloadItems.length > visible.length) {
    const overflow = groups.get(`${overlayId}-overflow`);
    if (overflow) rows.push([overflow]);
  }

  return rows;
}

async function buildAudienceModel(
  token: StatTrackedToken,
  sourceItemId: string,
  visibility: StatTrackerVisibility,
  sceneDpi: number,
): Promise<AudienceModel | undefined> {
  const payload = createTokenSyncPayloadForVisibility(token, visibility);
  if (payload.status !== "ready") return undefined;

  const api = getAudienceApi(visibility);
  const allItems = await api.getItems();
  const overlayItems = allItems.filter(
    (item) => readElement(item, sourceItemId, visibility) !== undefined,
  );
  if (overlayItems.length === 0) return undefined;

  const overlayId = createOverlayId(sourceItemId, visibility);
  const elementById = new Map<string, string>();
  for (const item of overlayItems) {
    const element = readElement(item, sourceItemId, visibility);
    if (element) elementById.set(item.id, element);
  }

  const groups = new Map<string, TrackerGroup>();
  const trackerByBaseId = new Map<string, StatTokenSyncItem>();

  for (const tracker of payload.items.slice(0, MAX_TRACKERS)) {
    const baseId = `${overlayId}-${sanitizeId(tracker.id)}`;
    trackerByBaseId.set(baseId, tracker);
    const group = makeGroup(baseId, tracker, overlayItems, elementById, sceneDpi);
    if (group) groups.set(baseId, group);
  }

  if (payload.items.length > MAX_TRACKERS) {
    const overflowBaseId = `${overlayId}-overflow`;
    const overflow = makeGroup(
      overflowBaseId,
      undefined,
      overlayItems,
      elementById,
      sceneDpi,
    );
    if (overflow) groups.set(overflowBaseId, overflow);
  }

  return {
    visibility,
    api,
    overlayId,
    metadata: createMetadata(token, sourceItemId, visibility),
    overlayItems,
    rows: buildRows(overlayId, payload.items, groups),
    trackerByBaseId,
    movement: new Map(),
    targetBounds: new Map(),
  };
}

function layoutModels(
  models: AudienceModel[],
  bounds: BoundingBox,
  scale: number,
  position: "top" | "bottom",
): void {
  const itemGap = ITEM_GAP * scale;
  const rowGap = ROW_GAP * scale;
  const audienceGap = AUDIENCE_GAP * scale;
  const tokenGap = TOKEN_GAP * scale;
  let cursor = position === "top" ? bounds.min.y - tokenGap : bounds.max.y + tokenGap;

  for (const model of models) {
    if (model.rows.length === 0) continue;

    const rowHeights = model.rows.map((row) => Math.max(...row.map((group) => group.bounds.height)));
    const blockHeight =
      rowHeights.reduce((sum, height) => sum + height, 0) +
      Math.max(0, model.rows.length - 1) * rowGap;
    const originY = position === "top" ? cursor - blockHeight : cursor;

    let y = originY;
    model.rows.forEach((row, rowIndex) => {
      const rowHeight = rowHeights[rowIndex];
      const rowWidth =
        row.reduce((sum, group) => sum + group.bounds.width, 0) +
        Math.max(0, row.length - 1) * itemGap;
      let x = bounds.center.x - rowWidth / 2;

      for (const group of row) {
        const targetY = y + (rowHeight - group.bounds.height) / 2;
        const dx = x - group.bounds.minX;
        const dy = targetY - group.bounds.minY;

        for (const id of group.memberIds) {
          model.movement.set(id, { x: dx, y: dy });
        }

        model.targetBounds.set(group.baseId, {
          minX: group.bounds.minX + dx,
          minY: group.bounds.minY + dy,
          maxX: group.bounds.maxX + dx,
          maxY: group.bounds.maxY + dy,
          width: group.bounds.width,
          height: group.bounds.height,
        });

        x += group.bounds.width + itemGap;
      }

      y += rowHeight;
      if (rowIndex < model.rows.length - 1) y += rowGap;
    });

    cursor =
      position === "top"
        ? originY - audienceGap
        : originY + blockHeight + audienceGap;
  }
}

function baseIdForElement(
  element: string,
  trackerByBaseId: Map<string, StatTokenSyncItem>,
): string | undefined {
  for (const baseId of trackerByBaseId.keys()) {
    if (element.startsWith(`${baseId}-`)) return baseId;
  }
  return undefined;
}

function alignTextClone(
  clone: Item,
  element: string,
  model: AudienceModel,
  scale: number,
): void {
  if (clone.type !== "TEXT") return;
  const baseId = baseIdForElement(element, model.trackerByBaseId);
  if (!baseId) return;
  const tracker = model.trackerByBaseId.get(baseId);
  const target = model.targetBounds.get(baseId);
  if (!tracker || !target) return;

  const isName = element === `${baseId}-name`;
  const isValue = element === `${baseId}-value`;
  if (!isName && !isValue) return;

  if (tracker.mode === "bar") {
    clone.position.y = target.minY + 5.5 * scale;
    clone.text.height = BAR_TEXT_HEIGHT * scale;
    clone.text.style.fontSize = (isValue ? 18.5 : 16.5) * scale;
  } else if (tracker.mode === "toggle" || tracker.mode === "value") {
    clone.position.y =
      target.minY + (target.height - VALUE_TEXT_HEIGHT * scale) / 2;
    clone.text.height = VALUE_TEXT_HEIGHT * scale;
    clone.text.style.fontSize = (isValue ? 18.5 : 17) * scale;
  }

  clone.text.style.lineHeight = 1;
  clone.text.style.textAlignVertical = "MIDDLE";
}

function inactiveElements(model: AudienceModel): {
  iconElements: Set<string>;
  muteElements: Set<string>;
} {
  const iconElements = new Set<string>();
  const muteElements = new Set<string>();

  for (const [baseId, tracker] of model.trackerByBaseId) {
    if (tracker.mode === "toggle" && tracker.enabled !== true) {
      iconElements.add(`${baseId}-icon`);
      muteElements.add(`${baseId}-mute`);
      continue;
    }

    if (tracker.mode !== "icon") continue;
    const max = Math.min(6, Math.max(1, Math.round(tracker.max ?? 1)));
    const current = Math.min(max, Math.max(0, Math.round(tracker.current ?? 0)));
    for (let index = current; index < max; index += 1) {
      iconElements.add(`${baseId}-unit-${index}-icon`);
      muteElements.add(`${baseId}-unit-${index}-mute`);
    }
  }

  return { iconElements, muteElements };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function grayscaleImageUrl(url: string, width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="gray" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter></defs><image href="${escapeXml(url)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" filter="url(#gray)"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function safeAccentColor(color: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#d85c72";
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function trackSvgUrl(): string {
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="24" viewBox="0 0 200 24"><defs><linearGradient id="track" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11151b"/><stop offset="0.5" stop-color="#06080b"/><stop offset="1" stop-color="#020305"/></linearGradient></defs><rect x="1" y="1" width="198" height="22" rx="11" fill="url(#track)" stroke="#6f6450" stroke-width="2"/><rect x="3" y="3" width="194" height="18" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.09" stroke-width="1"/><path d="M12 5H188" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2" stroke-linecap="round"/></svg>`,
  );
}

function fillSvgUrl(color: string): string {
  const accent = safeAccentColor(color);
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="24" viewBox="0 0 200 24"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.36"/><stop offset="0.18" stop-color="${accent}"/><stop offset="0.72" stop-color="${accent}"/><stop offset="1" stop-color="#000000" stop-opacity="0.32"/></linearGradient></defs><rect x="1" y="1" width="198" height="22" rx="11" fill="${accent}" fill-opacity="0.22"/><rect x="2" y="2" width="196" height="20" rx="10" fill="url(#fill)" stroke="#ffffff" stroke-opacity="0.20" stroke-width="1.2"/><path d="M12 5.5H188" stroke="#ffffff" stroke-opacity="0.36" stroke-width="2" stroke-linecap="round"/></svg>`,
  );
}

function pillImage(
  token: StatTrackedToken,
  sourceItemId: string,
  metadata: StatOverlayObrMetadata,
  id: string,
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
  sceneDpi: number,
  zIndex: number,
): Item {
  const logicalWidth = 200;
  const logicalHeight = 24;
  return buildImage(
    {
      width: logicalWidth,
      height: logicalHeight,
      url,
      mime: "image/svg+xml",
    },
    {
      dpi: logicalWidth,
      offset: { x: logicalWidth / 2, y: logicalHeight / 2 },
    },
  )
    .id(id)
    .name(`Stats Dock — ${token.name}`)
    .position({ x: x + width / 2, y: y + height / 2 })
    .rotation(0)
    .scale({
      x: width / sceneDpi,
      y: (height * logicalWidth) / (logicalHeight * sceneDpi),
    })
    .layer("ATTACHMENT")
    .zIndex(zIndex)
    .attachedTo(sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "SCALE", "ROTATION"])
    .metadata(elementMetadata(metadata, id))
    .build();
}

function roundedBarItems(
  token: StatTrackedToken,
  sourceItemId: string,
  model: AudienceModel,
  sceneDpi: number,
  scale: number,
): Item[] {
  const result: Item[] = [];

  for (const [baseId, tracker] of model.trackerByBaseId) {
    if (tracker.mode !== "bar") continue;
    const target = model.targetBounds.get(baseId);
    if (!target) continue;

    const trackX = target.minX + BAR_ICON_SLOT * scale;
    const trackY = target.minY + BAR_TRACK_Y * scale;
    const trackWidth = Math.max(
      30 * scale,
      target.width - (BAR_ICON_SLOT + BAR_RIGHT_PADDING) * scale,
    );
    const trackHeight = BAR_TRACK_HEIGHT * scale;
    const trackId = `${baseId}-pill-track`;

    result.push(
      pillImage(
        token,
        sourceItemId,
        model.metadata,
        trackId,
        trackSvgUrl(),
        trackX,
        trackY,
        trackWidth,
        trackHeight,
        sceneDpi,
        -20,
      ),
    );

    const max = Math.max(0, tracker.max ?? 0);
    const current = Math.max(0, tracker.current ?? 0);
    const ratio = max > 0 ? Math.min(1, current / max) : 0;
    if (ratio <= 0) continue;

    const inset = 1.5 * scale;
    const innerHeight = Math.max(2 * scale, trackHeight - inset * 2);
    const innerWidth = Math.max(2 * scale, trackWidth - inset * 2);
    const fillWidth = Math.max(innerHeight, innerWidth * ratio);
    const fillId = `${baseId}-pill-fill`;

    result.push(
      pillImage(
        token,
        sourceItemId,
        model.metadata,
        fillId,
        fillSvgUrl(tracker.accentColor),
        trackX + inset,
        trackY + inset,
        Math.min(innerWidth, fillWidth),
        innerHeight,
        sceneDpi,
        -14,
      ),
    );
  }

  return result;
}

async function applyAudiencePresentation(
  token: StatTrackedToken,
  sourceItemId: string,
  model: AudienceModel,
  sceneDpi: number,
  scale: number,
): Promise<void> {
  const elementById = new Map<string, string>();
  for (const item of model.overlayItems) {
    const element = readElement(item, sourceItemId, model.visibility);
    if (element) elementById.set(item.id, element);
  }

  const { iconElements, muteElements } = inactiveElements(model);
  const textItems = model.overlayItems.filter((item) => item.type === "TEXT");
  const nonTextItems = model.overlayItems.filter((item) => item.type !== "TEXT");
  const textReplacements: Item[] = [];

  for (const item of textItems) {
    if (item.type !== "TEXT") continue;
    const element = elementById.get(item.id);
    if (!element) continue;
    const delta = model.movement.get(item.id) ?? { x: 0, y: 0 };
    const clone = structuredClone(item);
    clone.position = {
      x: clone.position.x + delta.x,
      y: clone.position.y + delta.y,
    };
    alignTextClone(clone, element, model, scale);
    textReplacements.push(clone);
  }

  const nonTextIds = nonTextItems.map((item) => item.id);
  if (nonTextIds.length > 0) {
    await model.api.updateItems(nonTextIds, (drafts) => {
      for (const draft of drafts) {
        const element = elementById.get(draft.id);
        if (!element) continue;
        const delta = model.movement.get(draft.id) ?? { x: 0, y: 0 };
        draft.position = {
          x: draft.position.x + delta.x,
          y: draft.position.y + delta.y,
        };

        if (muteElements.has(element)) {
          draft.visible = false;
        }

        if (
          draft.type === "IMAGE" &&
          iconElements.has(element) &&
          !draft.image.url.startsWith("data:image/svg+xml")
        ) {
          draft.image = {
            ...draft.image,
            url: grayscaleImageUrl(
              draft.image.url,
              draft.image.width,
              draft.image.height,
            ),
            mime: "image/svg+xml",
          };
        }

        if (LEGACY_BAR_SUFFIXES.some((suffix) => element.endsWith(suffix))) {
          draft.visible = false;
        }
      }
    });
  }

  if (textItems.length > 0) {
    await model.api.deleteItems(textItems.map((item) => item.id));
  }

  const pills = roundedBarItems(
    token,
    sourceItemId,
    model,
    sceneDpi,
    scale,
  );
  if (pills.length > 0) {
    await model.api.addItems(pills);
  }

  if (textReplacements.length > 0) {
    await model.api.addItems(textReplacements);
  }
}

async function applyV21Presentation(token: StatTrackedToken): Promise<void> {
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return;

  const [bounds, sceneDpi, settings] = await Promise.all([
    OBR.scene.items.getItemBounds([sourceItemId]),
    OBR.scene.grid.getDpi(),
    getStatRoomSettings(),
  ]);
  const scale = tokenScale(bounds, sceneDpi);

  const models: AudienceModel[] = [];
  for (const visibility of AUDIENCES) {
    const model = await buildAudienceModel(
      token,
      sourceItemId,
      visibility,
      sceneDpi,
    );
    if (model) models.push(model);
  }

  layoutModels(models, bounds, scale, settings.tokenStatsPosition);

  for (const model of models) {
    await applyAudiencePresentation(
      token,
      sourceItemId,
      model,
      sceneDpi,
      scale,
    );
  }
}

/**
 * V21 affine la présentation sans toucher aux choix visuels validés en V20 :
 * - icônes inactives réellement désaturées, sans voile gris ;
 * - textes recentrés verticalement et alignés entre nom / valeur ;
 * - dock deux fois plus compact entre les indicateurs ;
 * - dock rapproché du token ;
 * - jauges remplacées par des barres arrondies de type « pill ».
 *
 * Les Text ne sont jamais modifiés après ajout : ils sont recréés directement
 * dans leur géométrie finale, afin de conserver le comportement fiable observé
 * depuis V17.
 */
export async function createOrUpdateTokenOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const result = await createOrUpdateTokenOverlayV20(token);

  if (result.status !== "created" && result.status !== "updated") {
    return result;
  }

  try {
    await applyV21Presentation(token);
    return result;
  } catch (error) {
    return {
      ...result,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Erreur Owlbear pendant la mise en forme V21 du Stat Dock.",
    };
  }
}
