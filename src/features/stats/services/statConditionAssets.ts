import type { StatTokenCondition } from "../statTypes";

const CONDITION_ASSET_MODULES = import.meta.glob<string>(
  "../assets/condition/FR/*.png",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

function normalizeAssetName(value: string): string {
  return value
    .replace(/\.png$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const CONDITION_ASSET_BY_NAME = new Map<string, string>();

for (const [path, url] of Object.entries(CONDITION_ASSET_MODULES)) {
  const filename = path.split("/").pop();
  if (!filename) continue;
  CONDITION_ASSET_BY_NAME.set(normalizeAssetName(filename), url);
}

export function getConditionAssetUrl(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): string | undefined {
  return (
    CONDITION_ASSET_BY_NAME.get(normalizeAssetName(condition.label)) ??
    CONDITION_ASSET_BY_NAME.get(normalizeAssetName(condition.shortLabel)) ??
    CONDITION_ASSET_BY_NAME.get(normalizeAssetName(condition.conditionId))
  );
}

export function hasConditionAsset(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): boolean {
  return Boolean(getConditionAssetUrl(condition));
}

export function getConditionAssetNames(): string[] {
  return [...CONDITION_ASSET_BY_NAME.keys()].sort((a, b) => a.localeCompare(b, "fr"));
}
