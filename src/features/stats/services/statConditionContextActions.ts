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
  initiativeEncounterId?: string;
  initiativeRound?: number;
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
  existing?: StatTokenCondition,
): StatTokenCondition | null {
  const definition = getStatConditionDefinition(conditionId);
  if (!definition) return null;

  const durationType = config.durationType === "manual" ? undefined : config.durationType;
  const rounds = durationType === "rounds" ? normalizePositiveInteger(config.rounds) : undefined;
  const encounterId =
    durationType === "rounds" || durationType === "encounter"
      ? config.initiativeEncounterId ?? existing?.initiativeEncounterId
      : undefined;
  const initiativeRound =
    durationType === "rounds"
      ? config.initiativeRound ?? existing?.initiativeStartRound
      : undefined;
  const expiresAtRound =
    durationType === "rounds"
      ? typeof config.initiativeRound === "number" && typeof rounds === "number"
        ? config.initiativeRound + rounds
        : existing?.initiativeExpiresAtRound
      : undefined;

  const condition = createTokenCondition(conditionId, {
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
  if (!condition) return null;

  return {
    ...condition,
    initiativeEncounterId: encounterId,
    initiativeStartRound: initiativeRound,
    initiativeExpiresAtRound: expiresAtRound,
  };
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
  const existing = getActiveTokenCondition(token, conditionId);
  const nextCondition = createConfiguredCondition(conditionId, config, existing);
  if (!nextCondition) return token;

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

export function getConditionDurationListText(
  condition: StatTokenCondition,
): string | undefined {
  if (condition.durationType === "rounds") {
    const rounds = condition.remainingRounds ?? condition.durationValue ?? 0;
    return `${rounds} round${rounds > 1 ? "s" : ""}`;
  }
  if (condition.durationType === "encounter") return "Rencontre";
  if (condition.durationType === "rest") return "Repos";
  return undefined;
}

export function getConditionDisplayName(condition: StatTokenCondition): string {
  const value = typeof condition.value === "number" ? ` + ${condition.value}` : "";
  return `${condition.label}${value}`;
}
