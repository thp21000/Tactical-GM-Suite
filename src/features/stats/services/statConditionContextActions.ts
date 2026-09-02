import type {
  StatConditionDurationType,
  StatTrackerVisibility,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";
import {
  createTokenCondition,
  getStatConditionDefinition,
} from "./statConditions";

export type StatConditionQuickConfig = {
  value?: number;
  durationType?: StatConditionDurationType;
  rounds?: number;
  visibility?: StatTrackerVisibility;
};

function now(): string {
  return new Date().toISOString();
}

function normalizePositiveInteger(value: number | undefined, fallback = 1): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function createConfiguredCondition(
  conditionId: string,
  config: StatConditionQuickConfig,
): StatTokenCondition | null {
  const definition = getStatConditionDefinition(conditionId);
  if (!definition) return null;

  const durationType = config.durationType === "manual" ? undefined : config.durationType;
  const rounds = durationType === "rounds" ? normalizePositiveInteger(config.rounds) : undefined;

  return createTokenCondition(conditionId, {
    value:
      definition.severityType === "none"
        ? undefined
        : normalizePositiveInteger(config.value),
    durationType,
    durationValue: rounds,
    remainingRounds: rounds,
    visibility: config.visibility ?? "public",
    showOnToken: true,
    tokenDisplayMode: "icon",
    tokenDisplayPriority: 50,
  });
}

export function getActiveTokenCondition(
  token: Pick<StatTrackedToken, "conditions">,
  conditionId: string,
): StatTokenCondition | undefined {
  return token.conditions.find((condition) => condition.conditionId === conditionId);
}

export function upsertQuickCondition(
  token: StatTrackedToken,
  conditionId: string,
  config: StatConditionQuickConfig,
): StatTrackedToken {
  const nextCondition = createConfiguredCondition(conditionId, config);
  if (!nextCondition) return token;

  const existing = getActiveTokenCondition(token, conditionId);
  const condition: StatTokenCondition = existing
    ? {
        ...nextCondition,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now(),
      }
    : nextCondition;

  return {
    ...token,
    conditions: existing
      ? token.conditions.map((current) =>
          current.conditionId === conditionId ? condition : current,
        )
      : [...token.conditions, condition],
    updatedAt: now(),
  };
}

export function removeQuickCondition(
  token: StatTrackedToken,
  conditionId: string,
): StatTrackedToken {
  if (!getActiveTokenCondition(token, conditionId)) return token;

  return {
    ...token,
    conditions: token.conditions.filter(
      (condition) => condition.conditionId !== conditionId,
    ),
    updatedAt: now(),
  };
}

export function getConditionDurationText(
  condition: StatTokenCondition,
): string | undefined {
  if (condition.durationType === "rounds") {
    const rounds = condition.remainingRounds ?? condition.durationValue ?? 0;
    return `${rounds} round${rounds > 1 ? "s" : ""}`;
  }
  if (condition.durationType === "encounter") return "Jusqu’à la fin de la rencontre";
  if (condition.durationType === "rest") return "Jusqu’au repos";
  return "Durée manuelle";
}

export function getConditionDisplayName(condition: StatTokenCondition): string {
  const value = typeof condition.value === "number" ? ` ${condition.value}` : "";
  return `${condition.label}${value}`;
}
