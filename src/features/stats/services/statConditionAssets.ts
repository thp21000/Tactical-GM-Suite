import type { StatTokenCondition } from "../statTypes";
import { normalizeStatConditionCatalogId } from "./statConditionCatalog";
import { getTrackerIcon } from "./statTrackerIcons";

const CONDITION_ASSET_MODULES = import.meta.glob(
  "../assets/condition/Icon/*.png",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

/**
 * Ces quelques entrées non canoniques restent uniquement pour que les anciennes
 * sauvegardes gardent un fallback visuel pendant leur migration progressive.
 */
const LEGACY_TRACKER_ICON_BY_ID: Record<string, string> = {
  marque_du_chasseur: "arcane_target",
  mort: "body_skull",
  enchevetre: "body_lock",
  saisi: "body_lock",
};

function normalizeRawId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getAssetIdFromPath(path: string): string {
  const filename = path.split("/").pop() ?? path;
  const basename = filename.replace(/\.png$/i, "").replace(/^\d+[_-]/, "");
  return normalizeStatConditionCatalogId(basename);
}

const CONDITION_ASSET_BY_ID = new Map(
  Object.entries(CONDITION_ASSET_MODULES).map(([path, src]) => [
    getAssetIdFromPath(path),
    src,
  ]),
);

/**
 * Owlbear scene images live outside the extension iframe. Vite asset imports
 * may be emitted as URLs relative to the extension deployment, so always turn
 * them into an absolute HTTPS URL before storing them in an Owlbear Image.
 */
function toAbsoluteAssetUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;

  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

export function getConditionAssetUrl(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): string | undefined {
  const canonicalId = normalizeStatConditionCatalogId(condition.conditionId);
  const canonicalAsset = CONDITION_ASSET_BY_ID.get(canonicalId);
  if (canonicalAsset) return toAbsoluteAssetUrl(canonicalAsset);

  const legacyId = normalizeRawId(condition.conditionId);
  const legacyTrackerIconId = LEGACY_TRACKER_ICON_BY_ID[legacyId];
  if (!legacyTrackerIconId) return undefined;

  const legacyAsset = getTrackerIcon(legacyTrackerIconId).src;
  return legacyAsset ? toAbsoluteAssetUrl(legacyAsset) : undefined;
}

export function hasConditionAsset(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): boolean {
  return Boolean(getConditionAssetUrl(condition));
}

export function getConditionAssetNames(): string[] {
  return [...CONDITION_ASSET_BY_ID.keys()].sort((a, b) => a.localeCompare(b));
}
