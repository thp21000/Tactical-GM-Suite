import type { StatTokenCondition } from "../statTypes";
import { isCanonicalStatConditionId } from "./statConditionCatalog";

const CONDITION_ASSET_MODULES = import.meta.glob(
  "../assets/condition/Icon/*.png",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

function normalizeAssetId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getAssetIdFromPath(path: string): string | undefined {
  const filename = path.split("/").pop() ?? path;
  const basename = filename.replace(/\.png$/i, "").replace(/^\d+[_-]/, "");
  const id = normalizeAssetId(basename);
  return isCanonicalStatConditionId(id) ? id : undefined;
}

const CONDITION_ASSET_BY_ID = new Map(
  Object.entries(CONDITION_ASSET_MODULES).flatMap(([path, src]) => {
    const id = getAssetIdFromPath(path);
    return id ? [[id, src] as const] : [];
  }),
);

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
  if (!isCanonicalStatConditionId(condition.conditionId)) return undefined;
  const asset = CONDITION_ASSET_BY_ID.get(condition.conditionId);
  return asset ? toAbsoluteAssetUrl(asset) : undefined;
}

export function hasConditionAsset(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): boolean {
  return Boolean(getConditionAssetUrl(condition));
}

export function getConditionAssetNames(): string[] {
  return [...CONDITION_ASSET_BY_ID.keys()].sort((a, b) => a.localeCompare(b));
}
