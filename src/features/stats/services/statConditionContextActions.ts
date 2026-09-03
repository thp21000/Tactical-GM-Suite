import type { TranslateFunction } from "../../../i18n/types";
import type {
  StatConditionDurationType,
  StatTrackerVisibility,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";
import {
  isSameStatConditionCatalogId,
  type SystemStatConditionDefinition,
} from "./statConditionCatalog";

export type StatConditionQuickConfig = {
  value?: number;
  durationType?: StatConditionDurationType;
  rounds?: number;
  visibility?: StatTrackerVisibility;
  initiativeEncounterId?: string;
  initiativeRound?: number;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback = 1,
  max?: number,
): number {
  const normalized =
    typeof value === "number" && Number.isFinite(value)
      ? Math.max(1, Math.floor(value))
      : fallback;
  return typeof max === "number" ? Math.min(max, normalized) : normalized;
}

function createConfiguredCondition(
  definition: SystemStatConditionDefinition,
  config: StatConditionQuickConfig,
  existing?: StatTokenCondition,
): StatTokenCondition {
  const timestamp = now();
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
  const value =
    definition.severityType === "none"
      ? undefined
      : normalizePositiveInteger(config.value, 1, definition.maxValue);

  return {
    id: existing?.id ?? createId("stat-condition"),
    conditionId: definition.id,
    label: definition.label,
    shortLabel: definition.shortLabel,
    iconId: definition.iconId,
    value,
    durationType,
    durationValue: rounds,
    remainingRounds: rounds,
    initiativeEncounterId: encounterId,
    initiativeStartRound: initiativeRound,
    initiativeExpiresAtRound: expiresAtRound,
    source: existing?.source,
    note: existing?.note,
    showOnToken: true,
    tokenDisplayMode: "icon",
    tokenDisplayPriority: existing?.tokenDisplayPriority ?? 50,
    visibility: config.visibility ?? existing?.visibility ?? "public",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export function getActiveTokenCondition(
  token: Pick<StatTrackedToken, "conditions">,
  conditionId: string,
): StatTokenCondition | undefined {
  return token.conditions.find((condition) =>
    isSameStatConditionCatalogId(condition.conditionId, conditionId),
  );
}

export function upsertQuickCondition(
  token: StatTrackedToken,
  definition: SystemStatConditionDefinition,
  config: StatConditionQuickConfig,
): StatTrackedToken {
  const existing = getActiveTokenCondition(token, definition.id);
  const nextCondition = createConfiguredCondition(definition, config, existing);

  return {
    ...token,
    conditions: existing
      ? token.conditions.map((current) =>
          current.id === existing.id ? nextCondition : current,
        )
      : [...token.conditions, nextCondition],
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
      (condition) => !isSameStatConditionCatalogId(condition.conditionId, conditionId),
    ),
    updatedAt: now(),
  };
}

function getRoundText(rounds: number, t: TranslateFunction): string {
  return t(
    rounds === 1
      ? "stats.conditions.duration.roundOne"
      : "stats.conditions.duration.roundMany",
    { count: rounds },
  );
}

export function getConditionDurationText(
  condition: StatTokenCondition,
  t: TranslateFunction,
): string {
  if (condition.durationType === "rounds") {
    const rounds = condition.remainingRounds ?? condition.durationValue ?? 0;
    return getRoundText(rounds, t);
  }
  if (condition.durationType === "encounter") {
    return t("stats.conditions.duration.untilEncounterEnd");
  }
  if (condition.durationType === "rest") {
    return t("stats.conditions.duration.untilRest");
  }
  return t("stats.conditions.duration.manualText");
}

export function getConditionDurationListText(
  condition: StatTokenCondition,
  t: TranslateFunction,
): string | undefined {
  if (condition.durationType === "rounds") {
    const rounds = condition.remainingRounds ?? condition.durationValue ?? 0;
    return getRoundText(rounds, t);
  }
  if (condition.durationType === "encounter") {
    return t("stats.conditions.duration.encounter");
  }
  if (condition.durationType === "rest") {
    return t("stats.conditions.duration.rest");
  }
  return undefined;
}

export function getConditionDisplayName(
  condition: StatTokenCondition,
  localizedLabel = condition.label,
): string {
  const value = typeof condition.value === "number" ? ` + ${condition.value}` : "";
  return `${localizedLabel}${value}`;
}
