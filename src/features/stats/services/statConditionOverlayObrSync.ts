import OBR, {
  buildImage,
  isImage,
  type BoundingBox,
  type Image,
  type Item,
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
import { getConditionDisplayName } from "./statConditionContextActions";

export const STAT_CONDITION_OVERLAY_METADATA_KEY = `${EXTENSION_ID}/stats-condition-overlay`;
export const STAT_CONDITION_OVERLAY_KIND = "stats-condition-badge";

export type StatConditionOverlayAction = "create-or-update" | "delete";
export type StatConditionOverlayStatus =
  | "created"
  | "updated"
  | "deleted"
  | "not-found"
  | "not-ready"
  | "unavailable"
  | "error";

export type StatConditionOverlaySyncResult = {
  status: StatConditionOverlayStatus;
  action: StatConditionOverlayAction;
  message: string;
  sourceItemId?: string;
};

const CONDITION_IMAGE_LOGICAL_SIZE = 1024;
/** Taille de référence pour un token occupant une case de grille. */
const BASE_BADGE_SCALE = 0.1144;
const MAX_BADGES_PER_RING = 12;
const BADGE_RING_GAP = 1.08;
/**
 * Place le centre des médaillons légèrement à l'extérieur du rayon du token.
 * Cela garde les icônes visuellement posées sur la couronne sans les faire
 * rentrer trop profondément dans le portrait.
 */
const FIRST_RING_RADIAL_OFFSET_BADGE_RATIO = 0.22;
/** Correction visuelle fine de la couronne par rapport au centre du token. */
const RING_CENTER_X_OFFSET_RATIO = -0.03;
const RING_CENTER_Y_OFFSET_RATIO = -0.025;

type BadgeRole = "icon" | "level";
type ConditionBadgeMetadata = {
  kind: typeof STAT_CONDITION_OVERLAY_KIND;
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
  scale: number;
  visibility: StatTrackerVisibility;
};

type DesiredBadgeItem = Image;

function createResult(
  action: StatConditionOverlayAction,
  status: StatConditionOverlayStatus,
  message: string,
  token: StatTrackedToken,
): StatConditionOverlaySyncResult {
  return { action, status, message, sourceItemId: token.sourceItemId };
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
    value.kind !== STAT_CONDITION_OVERLAY_KIND ||
    typeof value.tokenId !== "string" ||
    typeof value.sourceItemId !== "string" ||
    typeof value.conditionId !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isVisibility(value.visibility)
  ) {
    return undefined;
  }

  return {
    kind: STAT_CONDITION_OVERLAY_KIND,
    tokenId: value.tokenId,
    sourceItemId: value.sourceItemId,
    conditionId: value.conditionId,
    visibility: value.visibility,
    // Keep reading the old level role so a sync can delete stale level labels
    // already present in a room after this release.
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
      a.conditionId.localeCompare(b.conditionId),
  );
}

function getStartAngle(count: number): number {
  if (count === 2) return 0;
  if (count === 4) return -45;
  return -90;
}

/**
 * Conserve exactement la même proportion icône/token quelle que soit la taille
 * du token. Un token d'une case garde BASE_BADGE_SCALE ; un token de deux cases
 * reçoit des badges deux fois plus grands, etc.
 */
function getBadgeScale(bounds: BoundingBox, sceneDpi: number): number {
  const tokenDiameter = Math.max(bounds.width, bounds.height);
  if (!Number.isFinite(sceneDpi) || sceneDpi <= 0 || !Number.isFinite(tokenDiameter)) {
    return BASE_BADGE_SCALE;
  }
  return BASE_BADGE_SCALE * (tokenDiameter / sceneDpi);
}

function getPlacementForIndex(
  index: number,
  total: number,
  bounds: BoundingBox,
  sceneDpi: number,
  badgeScale: number,
): Vector2 {
  const ringIndex = Math.floor(index / MAX_BADGES_PER_RING);
  const indexInRing = index % MAX_BADGES_PER_RING;
  const ringItemCount = Math.min(
    MAX_BADGES_PER_RING,
    total - ringIndex * MAX_BADGES_PER_RING,
  );
  const angleStep = 360 / Math.max(1, ringItemCount);
  const angleDegrees = getStartAngle(ringItemCount) + indexInRing * angleStep;
  const angle = (angleDegrees * Math.PI) / 180;
  const badgeDiameter = sceneDpi * badgeScale;
  const tokenRadius = Math.max(bounds.width, bounds.height) / 2;
  const radius =
    tokenRadius +
    badgeDiameter * FIRST_RING_RADIAL_OFFSET_BADGE_RATIO +
    ringIndex * badgeDiameter * BADGE_RING_GAP;
  const centerX = bounds.center.x + tokenRadius * RING_CENTER_X_OFFSET_RATIO;
  const centerY = bounds.center.y + tokenRadius * RING_CENTER_Y_OFFSET_RATIO;

  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function createPlacements(
  token: StatTrackedToken,
  bounds: BoundingBox,
  sceneDpi: number,
): BadgePlacement[] {
  const conditions = getSortedConditions(token);
  const badgeScale = getBadgeScale(bounds, sceneDpi);
  return conditions.map((condition, index) => ({
    condition,
    position: getPlacementForIndex(
      index,
      conditions.length,
      bounds,
      sceneDpi,
      badgeScale,
    ),
    scale: badgeScale,
    visibility: condition.visibility ?? "public",
  }));
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
): ConditionBadgeMetadata {
  if (!token.sourceItemId) throw new Error("Token Owlbear non lié.");
  return {
    kind: STAT_CONDITION_OVERLAY_KIND,
    tokenId: token.id,
    sourceItemId: token.sourceItemId,
    conditionId: condition.conditionId,
    visibility: condition.visibility ?? "public",
    role: "icon",
    updatedAt: condition.updatedAt,
  };
}

function getConditionTooltip(condition: StatTokenCondition): string {
  return getConditionDisplayName(condition);
}

function buildConditionBadgeImage(
  token: StatTrackedToken,
  placement: BadgePlacement,
  assetUrl: string,
): Image {
  const { condition, position, scale } = placement;
  if (!token.sourceItemId) throw new Error("Token Owlbear non lié.");

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
    .name(getConditionTooltip(condition))
    .position(position)
    .rotation(0)
    .scale({ x: scale, y: scale })
    .layer("ATTACHMENT")
    .attachedTo(token.sourceItemId)
    .locked(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["COPY", "ROTATION"])
    .metadata({
      [STAT_CONDITION_OVERLAY_METADATA_KEY]: createBadgeMetadata(token, condition),
    })
    .build();
}

function buildDesiredItems(
  token: StatTrackedToken,
  placements: BadgePlacement[],
): DesiredBadgeItem[] {
  return placements.flatMap((placement) => {
    const assetUrl = getConditionAssetUrl(placement.condition);
    if (!assetUrl) return [];
    return [buildConditionBadgeImage(token, placement, assetUrl)];
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
  if (!isImage(existing) || !isImage(desired)) return false;

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
): Promise<StatConditionOverlaySyncResult> {
  if (!token.sourceItemId) {
    return createResult("create-or-update", "not-ready", "Token non lié à Owlbear.", token);
  }
  if (!canUseConditionOverlaySync()) {
    return createResult("create-or-update", "unavailable", "Affichage des conditions indisponible.", token);
  }
  if (!(await canCurrentPlayerManageOverlays())) {
    return createResult("create-or-update", "unavailable", "Action réservée au MJ.", token);
  }

  try {
    const [bounds, sceneDpi] = await Promise.all([
      OBR.scene.items.getItemBounds([token.sourceItemId]),
      OBR.scene.grid.getDpi(),
    ]);
    const desired = buildDesiredItems(
      token,
      createPlacements(token, bounds, sceneDpi),
    );
    const publicItems = desired.filter(
      (item) => readMetadata(item)?.visibility === "public",
    );
    const localItems = desired.filter(
      (item) => readMetadata(item)?.visibility !== "public",
    );
    const [publicResult, localResult] = await Promise.all([
      syncApiItems(getAudienceApi("public"), token, publicItems),
      syncApiItems(getAudienceApi("gm"), token, localItems),
    ]);

    const created = publicResult.created + localResult.created;
    const deleted = publicResult.deleted + localResult.deleted;
    const conditionCount = token.conditions.length;

    if (conditionCount === 0) {
      return createResult(
        "create-or-update",
        deleted > 0 ? "updated" : "not-ready",
        deleted > 0 ? "Badges de conditions retirés." : "Aucune condition active.",
        token,
      );
    }

    return createResult(
      "create-or-update",
      created > 0 ? "created" : "updated",
      `${conditionCount} condition${conditionCount > 1 ? "s" : ""} affichée${conditionCount > 1 ? "s" : ""} sur la couronne du token.`,
      token,
    );
  } catch (error) {
    return createResult(
      "create-or-update",
      "error",
      error instanceof Error ? error.message : "Erreur pendant l’affichage des conditions.",
      token,
    );
  }
}

export async function deleteTokenConditionOverlay(
  token: StatTrackedToken,
): Promise<StatConditionOverlaySyncResult> {
  if (!token.sourceItemId) {
    return createResult("delete", "not-ready", "Token non lié à Owlbear.", token);
  }
  if (!canUseConditionOverlaySync()) {
    return createResult("delete", "unavailable", "Affichage des conditions indisponible.", token);
  }

  try {
    const [publicItems, localItems] = await Promise.all([
      getExistingItems(OBR.scene.items, token),
      getExistingItems(OBR.scene.local, token),
    ]);
    if (publicItems.length > 0) {
      await OBR.scene.items.deleteItems(publicItems.map((item) => item.id));
    }
    if (localItems.length > 0) {
      await OBR.scene.local.deleteItems(localItems.map((item) => item.id));
    }
    const deleted = publicItems.length + localItems.length;

    return createResult(
      "delete",
      deleted > 0 ? "deleted" : "not-found",
      deleted > 0 ? "Badges de conditions supprimés." : "Aucun badge de condition trouvé.",
      token,
    );
  } catch (error) {
    return createResult(
      "delete",
      "error",
      error instanceof Error ? error.message : "Erreur pendant la suppression des conditions.",
      token,
    );
  }
}
