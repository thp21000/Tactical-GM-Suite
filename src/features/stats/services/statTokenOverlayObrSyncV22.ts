import OBR, { type BoundingBox, type Item, type Vector2 } from "@owlbear-rodeo/sdk";
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
  grayscaleImageUrl,
  roundedBarItems,
  type V22Box,
} from "./statTokenOverlayObrV22Visuals";
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

export { canUseObrOverlaySync, deleteTokenOverlay, findExistingStatsOverlay };
export type {
  StatOverlayObrExistingOverlay,
  StatOverlayObrManualAction,
  StatOverlayObrSyncResult,
  StatOverlayObrSyncStatus,
};

type OverlayApi = Pick<
  typeof OBR.scene.items,
  "getItems" | "addItems" | "deleteItems" | "updateItems"
>;

type TextLike = Item & {
  type: "TEXT";
  text: {
    height: number | "AUTO";
    style: {
      fontSize: number;
      lineHeight: number;
      textAlignVertical: "TOP" | "MIDDLE" | "BOTTOM";
    };
  };
};

type MutableImageDraft = {
  type: "IMAGE";
  image: { width: number; height: number; url: string; mime: string };
};

type Group = {
  baseId: string;
  tracker?: StatTokenSyncItem;
  current: V22Box;
  memberIds: string[];
};

type Model = {
  visibility: StatTrackerVisibility;
  api: OverlayApi;
  metadata: StatOverlayObrMetadata;
  items: Item[];
  elementById: Map<string, string>;
  trackerByBaseId: Map<string, StatTokenSyncItem>;
  rows: Group[][];
  movement: Map<string, Vector2>;
  targetByBaseId: Map<string, V22Box>;
};

const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];
const MAX_TRACKERS = 6;
const TOKEN_GAP = 4.5;
const AUDIENCE_GAP = 1;
const ITEM_GAP = 2.5;
const ROW_GAP = 2.5;
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

function getApi(visibility: StatTrackerVisibility): OverlayApi {
  return visibility === "public" ? OBR.scene.items : OBR.scene.local;
}

function readElement(
  item: Item,
  sourceItemId: string,
  visibility: StatTrackerVisibility,
): string | undefined {
  const metadata = item.metadata?.[STAT_OVERLAY_METADATA_KEY];
  if (!isRecord(metadata)) return undefined;
  return metadata.kind === STAT_OVERLAY_KIND &&
    metadata.sourceItemId === sourceItemId &&
    metadata.visibility === visibility &&
    typeof metadata.element === "string"
    ? metadata.element
    : undefined;
}

function metadataFor(
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

function tokenScale(bounds: BoundingBox, sceneDpi: number): number {
  const diameter = Math.max(bounds.width, bounds.height);
  return Number.isFinite(diameter) && sceneDpi > 0
    ? Math.max(0.25, diameter / sceneDpi)
    : 1;
}

function unitCount(tracker: StatTokenSyncItem): number {
  return Math.min(6, Math.max(1, Math.round(tracker.max ?? 1)));
}

function groupGeometry(
  baseId: string,
  tracker: StatTokenSyncItem | undefined,
  items: Item[],
  elementById: Map<string, string>,
  sceneDpi: number,
  scale: number,
): V22Box | undefined {
  if (!tracker) {
    const plate = items.find((item) => elementById.get(item.id) === `${baseId}-plate`);
    if (!plate) return undefined;
    const width = sceneDpi * Math.abs(plate.scale.x);
    const height = 28 * scale;
    return { minX: plate.position.x - width / 2, minY: plate.position.y - height / 2, width, height };
  }

  if (tracker.mode === "icon") {
    const first = items.find((item) => elementById.get(item.id) === `${baseId}-unit-0-frame`);
    if (!first) return undefined;
    const count = unitCount(tracker);
    const width = (count * 34 + (count - 1) * 4) * scale;
    const height = 34 * scale;
    return { minX: first.position.x - 17 * scale, minY: first.position.y - 17 * scale, width, height };
  }

  const plate = items.find((item) => elementById.get(item.id) === `${baseId}-plate`);
  if (!plate) return undefined;
  const width = sceneDpi * Math.abs(plate.scale.x);
  const height = (tracker.mode === "bar" ? 56 : 40) * scale;
  return { minX: plate.position.x - width / 2, minY: plate.position.y - height / 2, width, height };
}

function groupMembers(baseId: string, items: Item[], elementById: Map<string, string>): string[] {
  return items.flatMap((item) => {
    const element = elementById.get(item.id);
    return element?.startsWith(`${baseId}-`) ? [item.id] : [];
  });
}

function rowsFromPayload(
  overlayId: string,
  trackers: StatTokenSyncItem[],
  groups: Map<string, Group>,
): Group[][] {
  const rows: Group[][] = [];
  let inline: Group[] = [];
  const flush = () => {
    if (inline.length) rows.push(inline);
    inline = [];
  };
  const visible = trackers.slice(0, MAX_TRACKERS);

  for (const tracker of visible) {
    const group = groups.get(`${overlayId}-${sanitizeId(tracker.id)}`);
    if (!group) continue;
    if (tracker.mode === "bar" || tracker.mode === "icon") {
      flush();
      rows.push([group]);
    } else {
      inline.push(group);
      if (inline.length === 3) flush();
    }
  }
  flush();

  if (trackers.length > visible.length) {
    const overflow = groups.get(`${overlayId}-overflow`);
    if (overflow) rows.push([overflow]);
  }
  return rows;
}

async function buildModel(
  token: StatTrackedToken,
  sourceItemId: string,
  visibility: StatTrackerVisibility,
  sceneDpi: number,
  scale: number,
): Promise<Model | undefined> {
  const payload = createTokenSyncPayloadForVisibility(token, visibility);
  if (payload.status !== "ready") return undefined;
  const api = getApi(visibility);
  const allItems = await api.getItems();
  const items = allItems.filter((item) => readElement(item, sourceItemId, visibility));
  if (!items.length) return undefined;

  const metadata = metadataFor(token, sourceItemId, visibility);
  const overlayId = metadata.overlayId;
  const elementById = new Map<string, string>();
  for (const item of items) {
    const element = readElement(item, sourceItemId, visibility);
    if (element) elementById.set(item.id, element);
  }

  const groups = new Map<string, Group>();
  const trackerByBaseId = new Map<string, StatTokenSyncItem>();
  for (const tracker of payload.items.slice(0, MAX_TRACKERS)) {
    const baseId = `${overlayId}-${sanitizeId(tracker.id)}`;
    trackerByBaseId.set(baseId, tracker);
    const current = groupGeometry(baseId, tracker, items, elementById, sceneDpi, scale);
    if (current) groups.set(baseId, { baseId, tracker, current, memberIds: groupMembers(baseId, items, elementById) });
  }
  if (payload.items.length > MAX_TRACKERS) {
    const baseId = `${overlayId}-overflow`;
    const current = groupGeometry(baseId, undefined, items, elementById, sceneDpi, scale);
    if (current) groups.set(baseId, { baseId, current, memberIds: groupMembers(baseId, items, elementById) });
  }

  return {
    visibility,
    api,
    metadata,
    items,
    elementById,
    trackerByBaseId,
    rows: rowsFromPayload(overlayId, payload.items, groups),
    movement: new Map(),
    targetByBaseId: new Map(),
  };
}

function layout(models: Model[], bounds: BoundingBox, scale: number, position: "top" | "bottom") {
  const itemGap = ITEM_GAP * scale;
  const rowGap = ROW_GAP * scale;
  const audienceGap = AUDIENCE_GAP * scale;
  let cursor = position === "top"
    ? bounds.min.y - TOKEN_GAP * scale
    : bounds.max.y + TOKEN_GAP * scale;

  for (const model of models) {
    const heights = model.rows.map((row) => Math.max(...row.map((group) => group.current.height)));
    const blockHeight = heights.reduce((sum, value) => sum + value, 0) + Math.max(0, heights.length - 1) * rowGap;
    const originY = position === "top" ? cursor - blockHeight : cursor;
    let y = originY;

    model.rows.forEach((row, rowIndex) => {
      const rowHeight = heights[rowIndex];
      const rowWidth = row.reduce((sum, group) => sum + group.current.width, 0) + Math.max(0, row.length - 1) * itemGap;
      let x = bounds.center.x - rowWidth / 2;
      for (const group of row) {
        const targetY = y + (rowHeight - group.current.height) / 2;
        const delta = { x: x - group.current.minX, y: targetY - group.current.minY };
        group.memberIds.forEach((id) => model.movement.set(id, delta));
        model.targetByBaseId.set(group.baseId, {
          minX: x,
          minY: targetY,
          width: group.current.width,
          height: group.current.height,
        });
        x += group.current.width + itemGap;
      }
      y += rowHeight + (rowIndex < model.rows.length - 1 ? rowGap : 0);
    });

    cursor = position === "top"
      ? originY - audienceGap
      : originY + blockHeight + audienceGap;
  }
}

function baseIdFor(element: string, model: Model): string | undefined {
  for (const baseId of model.trackerByBaseId.keys()) {
    if (element.startsWith(`${baseId}-`)) return baseId;
  }
  return undefined;
}

function alignText(clone: Item, element: string, model: Model, scale: number) {
  if (clone.type !== "TEXT") return;
  const textClone = clone as unknown as TextLike;
  const baseId = baseIdFor(element, model);
  if (!baseId) return;
  const tracker = model.trackerByBaseId.get(baseId);
  const target = model.targetByBaseId.get(baseId);
  if (!tracker || !target) return;
  const isName = element === `${baseId}-name`;
  const isValue = element === `${baseId}-value`;
  if (!isName && !isValue) return;

  if (tracker.mode === "bar") {
    clone.position.y = target.minY + 5.5 * scale;
    textClone.text.height = 22 * scale;
    textClone.text.style.fontSize = (isValue ? 18.5 : 16.5) * scale;
  } else {
    clone.position.y = target.minY + (target.height - 23 * scale) / 2;
    textClone.text.height = 23 * scale;
    textClone.text.style.fontSize = (isValue ? 18.5 : 17) * scale;
  }
  textClone.text.style.lineHeight = 1;
  textClone.text.style.textAlignVertical = "MIDDLE";
}

function inactiveSets(model: Model) {
  const icons = new Set<string>();
  const mutes = new Set<string>();
  for (const [baseId, tracker] of model.trackerByBaseId) {
    if (tracker.mode === "toggle" && tracker.enabled !== true) {
      icons.add(`${baseId}-icon`);
      mutes.add(`${baseId}-mute`);
    }
    if (tracker.mode === "icon") {
      const max = unitCount(tracker);
      const current = Math.min(max, Math.max(0, Math.round(tracker.current ?? 0)));
      for (let index = current; index < max; index += 1) {
        icons.add(`${baseId}-unit-${index}-icon`);
        mutes.add(`${baseId}-unit-${index}-mute`);
      }
    }
  }
  return { icons, mutes };
}

async function applyModel(
  token: StatTrackedToken,
  sourceItemId: string,
  model: Model,
  sceneDpi: number,
  scale: number,
) {
  const { icons, mutes } = inactiveSets(model);
  const texts = model.items.filter((item) => item.type === "TEXT");
  const graphics = model.items.filter((item) => item.type !== "TEXT");
  const replacements: Item[] = [];

  for (const item of texts) {
    const element = model.elementById.get(item.id);
    if (!element) continue;
    const delta = model.movement.get(item.id) ?? { x: 0, y: 0 };
    const clone = structuredClone(item);
    clone.position = { x: clone.position.x + delta.x, y: clone.position.y + delta.y };
    alignText(clone, element, model, scale);
    replacements.push(clone);
  }

  if (graphics.length) {
    await model.api.updateItems(graphics.map((item) => item.id), (drafts) => {
      for (const draft of drafts) {
        const element = model.elementById.get(draft.id);
        if (!element) continue;
        const delta = model.movement.get(draft.id) ?? { x: 0, y: 0 };
        draft.position = { x: draft.position.x + delta.x, y: draft.position.y + delta.y };
        if (mutes.has(element)) draft.visible = false;
        if (draft.type === "IMAGE" && icons.has(element)) {
          const imageDraft = draft as unknown as MutableImageDraft;
          imageDraft.image = {
            ...imageDraft.image,
            url: grayscaleImageUrl(imageDraft.image.url, imageDraft.image.width, imageDraft.image.height),
            mime: "image/svg+xml",
          };
        }
        if (LEGACY_BAR_SUFFIXES.some((suffix) => element.endsWith(suffix))) draft.visible = false;
      }
    });
  }

  if (texts.length) await model.api.deleteItems(texts.map((item) => item.id));

  const pills: Item[] = [];
  for (const [baseId, tracker] of model.trackerByBaseId) {
    if (tracker.mode !== "bar") continue;
    const target = model.targetByBaseId.get(baseId);
    if (target) pills.push(...roundedBarItems(token, sourceItemId, model.metadata, baseId, tracker, target, sceneDpi, scale));
  }
  if (pills.length) await model.api.addItems(pills);
  if (replacements.length) await model.api.addItems(replacements);
}

async function applyV22(token: StatTrackedToken) {
  const sourceItemId = token.sourceItemId;
  if (!sourceItemId) return;
  const [bounds, sceneDpi, settings] = await Promise.all([
    OBR.scene.items.getItemBounds([sourceItemId]),
    OBR.scene.grid.getDpi(),
    getStatRoomSettings(),
  ]);
  const scale = tokenScale(bounds, sceneDpi);
  const models: Model[] = [];
  for (const visibility of AUDIENCES) {
    const model = await buildModel(token, sourceItemId, visibility, sceneDpi, scale);
    if (model) models.push(model);
  }
  layout(models, bounds, scale, settings.tokenStatsPosition);
  for (const model of models) await applyModel(token, sourceItemId, model, sceneDpi, scale);
}

export async function createOrUpdateTokenOverlay(token: StatTrackedToken): Promise<StatOverlayObrSyncResult> {
  const result = await createOrUpdateTokenOverlayV20(token);
  if (result.status !== "created" && result.status !== "updated") return result;
  try {
    await applyV22(token);
    return result;
  } catch (error) {
    return {
      ...result,
      status: "error",
      message: error instanceof Error ? error.message : "Erreur Owlbear pendant la mise en forme V22 du Stat Dock.",
    };
  }
}
