import OBR, {
  buildImage,
  buildLabel,
  isImage,
  isLabel,
  type BoundingBox,
  type Image,
  type Item,
  type Label,
  type Vector2,
} from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../../../core/constants/ids";
import { isObrReady } from "../../../core/obr/obrReady";
import type {
  StatTokenCondition,
  StatTrackedToken,
  StatTrackerVisibility,
} from "../statTypes";
import { getConditionAssetUrl } from "./statConditionAssets";
import {
  getConditionDisplayName,
  getConditionDurationText,
} from "./statConditionContextActions";
import type { StatOverlayObrSyncResult } from "./statTokenOverlayObrSync";

export const STAT_CONDITION_OVERLAY_METADATA_KEY = `${EXTENSION_ID}/stats-condition-overlay`;
export const STAT_CONDITION_OVERLAY_KIND = "stats-condition-badge";
const LEGACY_CONDITION_OVERLAY_KIND = "stats-condition-overlay";

const CONDITION_IMAGE_LOGICAL_SIZE = 1024;
const BADGE_SCALE = 0.24;
const BADGE_RING_GAP = 1.18;
const MAX_BADGES_PER_RING = 8;
const LEVEL_LABEL_FONT_SIZE = 10;
const AUDIENCES: StatTrackerVisibility[] = ["public", "private", "gm"];

type BadgeRole = "icon" | "level";

type ConditionBadgeMetadata = {
  kind: typeof STAT_CONDITION_OVERLAY_KIND | typeof LEGACY_CONDITION_OVERLAY_KIND;
  tokenId: string;
  sourceItemId: string;
  conditionId: string;
  visibility: StatTrackerVisibility;
  role: BadgeRole;
  updatedAt: string;
};

type OverlayItemsApi = Pick<
  typeof OBR.scene.items,
  "addItems" | "deleteItems" | "getItems" | "updateItems"
>;

type BadgePlacement = {
  condition: StatTokenCondition;
  position: Vector2;
  visibility: StatTrackerVisibility;
};

type DesiredBadgeItem = Image | Label;

function createResult(
  action: "create-or-update" | "delete",
  status: StatOverlayObrSyncResult["status"],
  message: string,
  token: StatTrackedToken,
): StatOverlayObrSyncResult {
  return {
    action,
    status,
    message,
    sourceItemId: token.sourceItemId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVisibility(value: unknown): value is StatTrackerVisibility {
  return value === "public" || value === "private" || value === "gm";
}

function readMetadata(item: Item): ConditionBadgeMetadata | undefined {
  const value = item.metadata?.[STAT_CONDITION_OVERLAY_METADATA_KEY];
  if (!isRecord(value)) return undefined;
  if (
    value.kind !== STAT_CONDITION_OVERLAY_KIND &&
    value.kind !== LEGACY_CONDITION_OVERLAY_KIND
  ) {
    return undefined;
  }
  if (
    typeof value.tokenId !== "string" ||
    typeof value.sourceItemId !== "string" ||
    typeof value.conditionId !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isVisibility(value.visibility)
  ) {
    return undefined;
  }

  return {
    kind: value.kind,
    tokenId: value.tokenId,
    sourceItemId: value.sourceItemId,
    conditionId: value.conditionId,
    visibility: value.visibility,
    role: value.role === "level" ? "level" : "icon",
    updatedAt: value.updatedAt,
  };
}

function matchesTokenOverlay(item: Item, token: StatTrackedToken): boolean {
  const metadata = readMetadata(item);
  return Boolean(
    metadata &&
      token.sourceItemId &&
      metadata.tokenId === token.id &&
      metadata.sourceItemId === token.sourceItemId,
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

function canUseConditionOverlaySync(): boolean {
  return Boolean(
    OBR.isAvailable &&
      isObrReady() &&
      typeof OBR.scene?.items?.getItems === "function" &&
      typeof OBR.scene.items.getItemBounds === "function" &&
      typeof OBR.scene.items.addItems === "function" &&
      typeof OBR.scene.items.updateItems === "function" &&
      typeof OBR.scene.items.deleteItems === "function" &&
      typeof OBR.scene.grid?.getDpi === "function" &&
      typeof OBR.scene.local?.getItems === "function" &&
      typeof OBR.scene.local.addItems === "function" &&
      typeof OBR.scene.local.updateItems === "function" &&
      typeof OBR.scene.local.deleteItems === "function",
  );
}

function getSortedConditions(token: StatTrackedToken): StatTokenCondition[] {
  return [...token.conditions].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) ||
      a.shortLabel.localeCompare(b.shortLabel, "fr"),
  );
}

function getStartAngle(count: number): number {
  if (count <= 1) return -90;
  if (count === 2) return 0;
  if (count === 3) return -90;
  if (count === 4) return -45;
  return -90;
}

function getRingCount(itemCount: number): number {
  return Math.ceil(itemCount / MAX_BADGES_PER_RING);
}

function getPlacementForIndex(
  index: number,
  total: number,
  firstRingIndex: number,
  bounds: BoundingBox,
  sceneDpi: number,
): Vector2 {
  const ringOffset = Math.floor(index / MAX_BADGES_PER_RING);
  const indexInRing = index % MAX_BADGES_PER_RING;
  const ringItemCount = Math.min(
    MAX_BADGES_PER_RING,
    total - ringOffset * MAX_BADGES_PER_RING,
  );
  const angleStep = 360 / Math.max(1, ringItemCount);
  const angleDegrees = getStartAngle(ringItemCount) + indexInRing * angleStep;
  const angle = (angleDegrees * Math.PI) / 180;
  const badgeDiameter = sceneDpi * BADGE_SCALE;
  const tokenRadius = Math.max(bounds.width, bounds.height) / 2;
  const globalRing = firstRingIndex + ringOffset;
  const radius =
    tokenRadius +
    badgeDiameter * 0.72 +
    globalRing * badgeDiameter * BADGE_RING_GAP;

  return {
    x: bounds.center.x + Math.cos(angle) * radius,
    y: bounds.center.y + Math.sin(angle) * radius,
  };
}

function createPlacements(
  token: StatTrackedToken,
  bounds: BoundingBox,
  sceneDpi: number,
): BadgePlacement[] {
  const conditions = getSortedConditions(token);
  const publicConditions = conditions.filter(
    (condition) => (condition.visibility ?? "public") === "public",
  );
  const localConditions = conditions.filter(
    (condition) => (condition.visibility ?? "public") !== "public",
  );
  const publicRingCount = getRingCount(publicConditions.length);

  const publicPlacements = publicConditions.map((condition, index) => ({
    condition,
    position: getPlacementForIndex(
      index,
      publicConditions.length,
      0,
      bounds,
      sceneDpi,
    ),
    visibility: "public" as const,
  }));

  const localPlacements = localConditions.map((condition, index) => ({
    condition,
    position: getPlacementForIndex(
      index,
      localConditions.length,
      publicRingCount,
      bounds,
      sceneDpi,
    ),
    visibility: condition.visibility ?? "gm",
  }));

  return [...publicPlacements, ...localPlacements];
}

function createBadgeId(
  token: StatTrackedToken,
  condition: StatTokenCondition,
  role: BadgeRole,
): string {
  return `tactical-gm-condition-badge-${token.sourceItemId}-${condition.id}-${role}`;
}

function createBadgeMetadata(
  token: StatTrackedToken,
  condition: StatTokenCondition,
  role: BadgeRole,
): ConditionBadgeMetadata {
  if (!token.sourceItemId) throw new Error("Token Owlbear non lié.");
  return {
    kind: STAT_CONDITION_OVERLAY_KIND,
    tokenId: token.id,
    sourceItemId: token.sourceItemId,
    conditionId: condition.conditionId,
    visibility: condition.visibility ?? "public",
    role,
    updatedAt: condition.updatedAt,
  };
}

function getConditionTooltip(condition: StatTokenCondition): string {
  const duration = getConditionDurationText(condition);
  return [getConditionDisplayName(condition), duration].filter(Boolean).join(" · ");
}

function buildConditionBadgeImage(
  token: StatTrackedToken,
  placement: BadgePlacement,
  assetUrl: string,
): Image {
  const { condition, position } = placement;
  if (!token.sourceItemId) throw new Error("Token Owlbear non lié.");
  const tooltip = getConditionTooltip(condition);

  return buildImage(
    {
      width: CONDITION_IMAGE_LOGICAL_SIZE,
      height: CONDITION_IMAGE_LOGICAL_SIZE,
      url: assetUrl,
      mime: "image/png",
    },
    {
      dpi: CONDITION_IMAGE_LOGICAL_SIZE,
      offset: {
        x: CONDITION_IMAGE_LOGICAL_SIZE / 2,
        y: CONDITION_IMAGE_LOGICAL_SIZE / 2,
      },
    },
  )
    .id(createBadgeId(token, condition, "icon"))
    .name(tooltip)
    .position(position)
    .rotation(0)
    .scale({ x: BADGE_SCALE, y: BADGE_SCALE })
    .layer("ATTACHMENT")
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "ROTATION"])
    .metadata({
      [STAT_CONDITION_OVERLAY_METADATA_KEY]: createBadgeMetadata(
        token,
        condition,
        "icon",
      ),
    })
    .build();
}

function buildConditionLevelLabel(
  token: StatTrackedToken,
  placement: BadgePlacement,
  sceneDpi: number,
): Label | null {
  const { condition, position } = placement;
  if (!token.sourceItemId || typeof condition.value !== "number") return null;
  const badgeDiameter = sceneDpi * BADGE_SCALE;
  const tooltip = getConditionTooltip(condition);

  return buildLabel()
    .id(createBadgeId(token, condition, "level"))
    .name(tooltip)
    .plainText(String(condition.value))
    .fontSize(LEVEL_LABEL_FONT_SIZE)
    .fontWeight(800)
    .padding(2)
    .fillColor("#ffffff")
    .backgroundColor("#242333")
    .backgroundOpacity(0.96)
    .cornerRadius(8)
    .position({
      x: position.x + badgeDiameter * 0.28,
      y: position.y + badgeDiameter * 0.28,
    })
    .rotation(0)
    .scale({ x: 1, y: 1 })
    .layer("ATTACHMENT")
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "ROTATION"])
    .metadata({
      [STAT_CONDITION_OVERLAY_METADATA_KEY]: createBadgeMetadata(
        token,
        condition,
        "level",
      ),
    })
    .build();
}

function buildDesiredItems(
  token: StatTrackedToken,
  placements: BadgePlacement[],
  sceneDpi: number,
): DesiredBadgeItem[] {
  return placements.flatMap((placement) => {
    const assetUrl = getConditionAssetUrl(placement.condition);
    if (!assetUrl) return [];

    const image = buildConditionBadgeImage(token, placement, assetUrl);
    const level = buildConditionLevelLabel(token, placement, sceneDpi);
    return level ? [image, level] : [image];
  });
}

async function getExistingItems(
  api: OverlayItemsApi,
  token: StatTrackedToken,
): Promise<Item[]> {
  return api.getItems((item) => matchesTokenOverlay(item, token));
}

async function updateExistingItem(
  api: OverlayItemsApi,
  existing: Item,
  desired: DesiredBadgeItem,
): Promise<boolean> {
  if (isImage(existing) && isImage(desired)) {
    await api.updateItems([existing], (drafts) => {
      const [draft] = drafts;
      if (!draft || !isImage(draft)) return;
      draft.name = desired.name;
      draft.image = desired.image;
      draft.grid = desired.grid;
      draft.position = desired.position;
      draft.rotation = desired.rotation;
      draft.scale = desired.scale;
      draft.layer = desired.layer;
      draft.attachedTo = desired.attachedTo;
      draft.locked = desired.locked;
      draft.disableAutoZIndex = desired.disableAutoZIndex;
      draft.disableAttachmentBehavior = desired.disableAttachmentBehavior;
      draft.metadata = desired.metadata;
    });
    return true;
  }

  if (isLabel(existing) && isLabel(desired)) {
    await api.updateItems([existing], (drafts) => {
      const [draft] = drafts;
      if (!draft || !isLabel(draft)) return;
      draft.name = desired.name;
      draft.position = desired.position;
      draft.rotation = desired.rotation;
      draft.scale = desired.scale;
      draft.layer = desired.layer;
      draft.attachedTo = desired.attachedTo;
      draft.locked = desired.locked;
      draft.disableHit = desired.disableHit;
      draft.disableAutoZIndex = desired.disableAutoZIndex;
      draft.disableAttachmentBehavior = desired.disableAttachmentBehavior;
      draft.text = desired.text;
      draft.style = desired.style;
      draft.metadata = desired.metadata;
    });
    return true;
  }

  return false;
}

async function syncApiItems(
  api: OverlayItemsApi,
  token: StatTrackedToken,
  desiredItems: DesiredBadgeItem[],
): Promise<{ created: number; updated: number; deleted: number }> {
  const existingItems = await getExistingItems(api, token);
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  const desiredIds = new Set(desiredItems.map((item) => item.id));
  const staleIds = existingItems
    .filter((item) => !desiredIds.has(item.id))
    .map((item) => item.id);

  if (staleIds.length > 0) await api.deleteItems(staleIds);

  let created = 0;
  let updated = 0;

  for (const desired of desiredItems) {
    const existing = existingById.get(desired.id);
    if (!existing) {
      await api.addItems([desired]);
      created += 1;
      continue;
    }

    if (await updateExistingItem(api, existing, desired)) {
      updated += 1;
      continue;
    }

    await api.deleteItems([existing.id]);
    await api.addItems([desired]);
    created += 1;
  }

  return { created, updated, deleted: staleIds.length };
}

export async function createOrUpdateTokenConditionOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  if (!token.sourceItemId) {
    return createResult("create-or-update", "not-ready", "Token non lié à Owlbear.", token);
  }
  if (!canUseConditionOverlaySync()) {
    return createResult(
      "create-or-update",
      "unavailable",
      "Affichage des conditions indisponible.",
      token,
    );
  }
  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult("create-or-update", "unavailable", "Action réservée au MJ.", token);
  }

  try {
    const [bounds, sceneDpi] = await Promise.all([
      OBR.scene.items.getItemBounds([token.sourceItemId]),
      OBR.scene.grid.getDpi(),
    ]);
    const placements = createPlacements(token, bounds, sceneDpi);
    const desired = buildDesiredItems(token, placements, sceneDpi);
    const publicItems = desired.filter((item) => {
      const metadata = readMetadata(item);
      return metadata?.visibility === "public";
    });
    const localItems = desired.filter((item) => {
      const metadata = readMetadata(item);
      return metadata?.visibility !== "public";
    });

    const [publicResult, localResult] = await Promise.all([
      syncApiItems(getAudienceApi("public"), token, publicItems),
      syncApiItems(getAudienceApi("gm"), token, localItems),
    ]);

    const created = publicResult.created + localResult.created;
    const updated = publicResult.updated + localResult.updated;
    const deleted = publicResult.deleted + localResult.deleted;
    const conditionCount = token.conditions.length;

    if (conditionCount === 0) {
      return createResult(
        "create-or-update",
        deleted > 0 ? "updated" : "not-ready",
        deleted > 0
          ? "Badges de conditions retirés."
          : "Aucune condition active.",
        token,
      );
    }

    return createResult(
      "create-or-update",
      created > 0 ? "created" : updated > 0 || deleted > 0 ? "updated" : "updated",
      `${conditionCount} condition${conditionCount > 1 ? "s" : ""} affichée${conditionCount > 1 ? "s" : ""} autour du token.`,
      token,
    );
  } catch (error) {
    return createResult(
      "create-or-update",
      "error",
      error instanceof Error
        ? error.message
        : "Erreur pendant l’affichage des conditions.",
      token,
    );
  }
}

export async function deleteTokenConditionOverlay(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  if (!token.sourceItemId) {
    return createResult("delete", "not-ready", "Token non lié à Owlbear.", token);
  }
  if (!canUseConditionOverlaySync()) {
    return createResult("delete", "unavailable", "Affichage des conditions indisponible.", token);
  }

  try {
    let deleted = 0;
    for (const visibility of AUDIENCES) {
      const api = getAudienceApi(visibility);
      const items = await getExistingItems(api, token);
      if (items.length === 0) continue;
      await api.deleteItems(items.map((item) => item.id));
      deleted += items.length;
      if (visibility === "private") break;
    }

    return createResult(
      "delete",
      deleted > 0 ? "deleted" : "not-found",
      deleted > 0
        ? "Badges de conditions supprimés."
        : "Aucun badge de condition trouvé.",
      token,
    );
  } catch (error) {
    return createResult(
      "delete",
      "error",
      error instanceof Error
        ? error.message
        : "Erreur pendant la suppression des conditions.",
      token,
    );
  }
}
