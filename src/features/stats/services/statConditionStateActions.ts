import type {
  StatConditionDurationType,
  StatConditionTokenDisplayMode,
  StatTokenCondition,
  StatTrackedToken,
  StatTrackerVisibility,
} from "../statTypes";
import { isCanonicalStatConditionId } from "./statConditionCatalog";

export type StatTokenConditionInput = {
  value?: number;
  durationType?: StatConditionDurationType;
  durationValue?: number;
  remainingRounds?: number;
  source?: string;
  note?: string;
  showOnToken?: boolean;
  tokenDisplayMode?: StatConditionTokenDisplayMode;
  tokenDisplayPriority?: number;
  visibility?: StatTrackerVisibility;
};

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  return `stat-condition-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizePositiveInteger(value: unknown, fallback?: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeVisibility(value: unknown): StatTrackerVisibility {
  return value === "gm" || value === "private" || value === "public"
    ? value
    : "public";
}

function normalizeDurationType(
  value: unknown,
): StatConditionDurationType | undefined {
  return value === "rounds" || value === "encounter" || value === "rest"
    ? value
    : undefined;
}

function applyConditionInput(
  condition: StatTokenCondition,
  input: StatTokenConditionInput,
): StatTokenCondition {
  const durationType = normalizeDurationType(input.durationType);
  const durationValue =
    durationType === "rounds"
      ? normalizePositiveInteger(input.durationValue, 1)
      : undefined;
  const remainingRounds =
    durationType === "rounds"
      ? normalizePositiveInteger(input.remainingRounds, durationValue ?? 1)
      : undefined;

  return {
    ...condition,
    value:
      typeof input.value === "number" && Number.isFinite(input.value)
        ? input.value
        : condition.value,
    durationType,
    durationValue,
    remainingRounds,
    source: cleanText(input.source) ?? condition.source,
    note: cleanText(input.note) ?? condition.note,
    // Conditions own their token display; every active condition is displayed.
    showOnToken: true,
    tokenDisplayMode: "icon",
    tokenDisplayPriority: normalizePositiveInteger(input.tokenDisplayPriority, 50),
    visibility: normalizeVisibility(input.visibility ?? condition.visibility),
    updatedAt: now(),
  };
}

export function addConditionToToken(
  token: StatTrackedToken,
  conditionId: string,
  input?: number | StatTokenConditionInput,
): StatTrackedToken {
  if (!isCanonicalStatConditionId(conditionId)) return token;
  if (token.conditions.some((condition) => condition.conditionId === conditionId)) {
    return token;
  }

  const timestamp = now();
  const normalizedInput: StatTokenConditionInput =
    typeof input === "number" ? { value: input } : input ?? {};
  const base: StatTokenCondition = {
    id: createId(),
    conditionId,
    label: conditionId,
    shortLabel: conditionId,
    iconId: "object_circle",
    visibility: "public",
    showOnToken: true,
    tokenDisplayMode: "icon",
    tokenDisplayPriority: 50,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const condition = applyConditionInput(base, normalizedInput);

  return {
    ...token,
    conditions: [...token.conditions, condition],
    updatedAt: timestamp,
  };
}

export function updateTokenCondition(
  token: StatTrackedToken,
  tokenConditionId: string,
  input: StatTokenConditionInput,
): StatTrackedToken {
  const timestamp = now();
  return {
    ...token,
    conditions: token.conditions.map((condition) =>
      condition.id === tokenConditionId
        ? applyConditionInput(condition, input)
        : condition,
    ),
    updatedAt: timestamp,
  };
}

export function decrementTokenConditionDuration(
  token: StatTrackedToken,
  tokenConditionId: string,
): StatTrackedToken {
  const timestamp = now();
  return {
    ...token,
    conditions: token.conditions.map((condition) =>
      condition.id === tokenConditionId && condition.durationType === "rounds"
        ? {
            ...condition,
            remainingRounds: Math.max(0, (condition.remainingRounds ?? 0) - 1),
            updatedAt: timestamp,
          }
        : condition,
    ),
    updatedAt: timestamp,
  };
}

export function clearTokenConditionDuration(
  token: StatTrackedToken,
  tokenConditionId: string,
): StatTrackedToken {
  const timestamp = now();
  return {
    ...token,
    conditions: token.conditions.map((condition) =>
      condition.id === tokenConditionId
        ? {
            ...condition,
            durationType: undefined,
            durationValue: undefined,
            remainingRounds: undefined,
            updatedAt: timestamp,
          }
        : condition,
    ),
    updatedAt: timestamp,
  };
}

export function removeConditionFromToken(
  token: StatTrackedToken,
  tokenConditionId: string,
): StatTrackedToken {
  const nextConditions = token.conditions.filter(
    (condition) => condition.id !== tokenConditionId,
  );
  if (nextConditions.length === token.conditions.length) return token;

  return {
    ...token,
    conditions: nextConditions,
    updatedAt: now(),
  };
}
