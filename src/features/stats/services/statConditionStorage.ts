import type {
  StatConditionDurationType,
  StatTrackerVisibility,
  StatTokenCondition,
} from "../statTypes";
import { isCanonicalStatConditionId } from "./statConditionCatalog";

const DURATION_TYPES = new Set<StatConditionDurationType>([
  "manual",
  "rounds",
  "encounter",
  "rest",
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
    createdAt: cleanText(record.createdAt) ?? timestamp,
    updatedAt: cleanText(record.updatedAt) ?? timestamp,
  };
}

/**
 * Canonical-only persistence. Unknown/obsolete condition IDs are discarded.
 * No single-condition display rule exists: every active condition is preserved.
 */
export function normalizeTokenConditions(value: unknown): StatTokenCondition[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map(normalizeCondition)
    .filter((condition): condition is StatTokenCondition => Boolean(condition));

  return normalized.filter(
    (condition, index, conditions) =>
      conditions.findIndex(
        (candidate) => candidate.conditionId === condition.conditionId,
      ) === index,
  );
}
