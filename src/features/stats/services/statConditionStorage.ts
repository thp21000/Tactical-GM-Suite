import type {
  StatConditionDerivationMode,
  StatConditionDerivationSource,
  StatConditionDurationType,
  StatTrackerVisibility,
  StatTokenCondition,
} from "../statTypes";
import { isCanonicalStatConditionId } from "./statConditionCatalog";
import { reconcileDerivedConditionList } from "./statConditionDerivations";

const DURATION_TYPES = new Set<StatConditionDurationType>([
  "manual",
  "rounds",
  "encounter",
  "rest",
]);
const DERIVATION_MODES = new Set<StatConditionDerivationMode>([
  "while-active",
  "on-apply",
]);

function createId(): string {
  return `stat-condition-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function integer(value: unknown): number | undefined {
  const number = finiteNumber(value);
  return number === undefined ? undefined : Math.max(0, Math.floor(number));
}

function visibility(value: unknown): StatTrackerVisibility {
  return value === "gm" || value === "private" || value === "public"
    ? value
    : "public";
}

function durationType(value: unknown): StatConditionDurationType | undefined {
  return typeof value === "string" && DURATION_TYPES.has(value as StatConditionDurationType)
    ? (value as StatConditionDurationType)
    : undefined;
}

function derivationSources(value: unknown): StatConditionDerivationSource[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sources: StatConditionDerivationSource[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    if (!isCanonicalStatConditionId(record.conditionId)) continue;
    if (
      typeof record.mode !== "string" ||
      !DERIVATION_MODES.has(record.mode as StatConditionDerivationMode)
    ) {
      continue;
    }
    const source: StatConditionDerivationSource = {
      conditionId: record.conditionId,
      mode: record.mode as StatConditionDerivationMode,
    };
    if (
      !sources.some(
        (candidate) =>
          candidate.conditionId === source.conditionId && candidate.mode === source.mode,
      )
    ) {
      sources.push(source);
    }
  }

  return sources.length > 0 ? sources : undefined;
}

function normalizeCondition(entry: unknown): StatTokenCondition | undefined {
  if (!entry || typeof entry !== "object") return undefined;
  const record = entry as Record<string, unknown>;
  if (!isCanonicalStatConditionId(record.conditionId)) return undefined;

  const timestamp = new Date().toISOString();
  const label = cleanText(record.label) ?? record.conditionId;
  const duration = durationType(record.durationType);
  const durationValue = duration === "rounds" ? integer(record.durationValue) : undefined;
  const remainingRounds =
    duration === "rounds"
      ? integer(record.remainingRounds) ?? durationValue ?? 1
      : undefined;

  return {
    id: cleanText(record.id) ?? createId(),
    conditionId: record.conditionId,
    label,
    shortLabel: cleanText(record.shortLabel) ?? label,
    iconId: cleanText(record.iconId) ?? "object_circle",
    value: finiteNumber(record.value),
    durationType: duration === "manual" ? undefined : duration,
    durationValue,
    remainingRounds,
    initiativeEncounterId: cleanText(record.initiativeEncounterId),
    initiativeStartRound: integer(record.initiativeStartRound),
    initiativeExpiresAtRound: integer(record.initiativeExpiresAtRound),
    source: cleanText(record.source),
    note: cleanText(record.note),
    showOnToken: true,
    tokenDisplayMode: "icon",
    tokenDisplayPriority: integer(record.tokenDisplayPriority) ?? 50,
    visibility: visibility(record.visibility),
    isExplicit: record.isExplicit !== false,
    derivedFrom: derivationSources(record.derivedFrom),
    createdAt: cleanText(record.createdAt) ?? timestamp,
    updatedAt: cleanText(record.updatedAt) ?? timestamp,
  };
}

/**
 * Canonical-only persistence. Unknown/obsolete condition IDs are discarded.
 * No single-condition display rule exists: every active condition is preserved.
 * Derived while-active conditions are also pruned when their last source is gone.
 */
export function normalizeTokenConditions(value: unknown): StatTokenCondition[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map(normalizeCondition)
    .filter((condition): condition is StatTokenCondition => Boolean(condition));

  const unique = normalized.filter(
    (condition, index, conditions) =>
      conditions.findIndex(
        (candidate) => candidate.conditionId === condition.conditionId,
      ) === index,
  );

  return reconcileDerivedConditionList(unique);
}
