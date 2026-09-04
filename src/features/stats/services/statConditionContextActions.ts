import type { TranslateFunction } from "../../../i18n/types";
import type {
  StatConditionDurationType,
  StatTrackerVisibility,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";
import type { SystemStatConditionDefinition } from "./statConditionCatalog";
import {
  applyStatConditionImplications,
  removeExplicitConditionAndReconcile,
} from "./statConditionDerivations";

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

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizePositiveInteger(value: number | undefined, fallback = 1): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function createConfiguredCondition(
  definition: SystemStatConditionDefinition,
  config: StatConditionQuickConfig,
  existing?: StatTokenCondition,
): StatTokenCondition {
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
  const timestamp = now();

  return {
    id: existing?.id ?? createId("stat-condition"),
    conditionId: definition.id,
    label: definition.label,
    shortLabel: definition.shortLabel,
    iconId: definition.iconId,
    value:
      definition.severityType === "none"
        ? undefined
        : Math.min(
            definition.maxValue ?? Number.POSITIVE_INFINITY,
            normalizePositiveInteger(config.value),
          ),
    durationType,
    durationValue: rounds,
    remainingRounds: rounds,
    initiativeEncounterId: encounterId,
    initiativeStartRound: initiativeRound,
    initiativeExpiresAtRound: expiresAtRound,
    visibility: config.visibility ?? existing?.visibility ?? "public",
    showOnToken: true,
    tokenDisplayMode: "icon",
    tokenDisplayPriority: 50,
    isExplicit: true,
    derivedFrom: existing?.derivedFrom,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
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
  definition: SystemStatConditionDefinition,
  config: StatConditionQuickConfig,
): StatTrackedToken {
  const existing = getActiveTokenCondition(token, definition.id);
  const condition = createConfiguredCondition(definition, config, existing);
  const next: StatTrackedToken = {
    ...token,
    conditions: existing
      ? token.conditions.map((current) =>
          current.id === existing.id ? condition : current,
        )
      : [...token.conditions, condition],
    updatedAt: now(),
  };

  return applyStatConditionImplications(next, definition, !existing);
}

export function removeQuickCondition(
  token: StatTrackedToken,
  conditionId: string,
): StatTrackedToken {
  return removeExplicitConditionAndReconcile(token, conditionId);
}

export function getConditionDurationText(
  condition: StatTokenCondition,
  t: TranslateFunction,
): string {
  if (condition.durationType === "rounds") {
    const rounds = condition.remainingRounds ?? condition.durationValue ?? 0;
    return t(
      rounds === 1
        ? "stats.conditions.duration.roundOne"
        : "stats.conditions.duration.roundMany",
      { count: rounds },
    );
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
  const automatic = (condition.derivedFrom?.length ?? 0) > 0
    ? t("stats.conditions.automatic.badge")
    : undefined;
  let duration: string | undefined;

  if (condition.durationType === "rounds") {
    const rounds = condition.remainingRounds ?? condition.durationValue ?? 0;
    duration = t(
      rounds === 1
        ? "stats.conditions.duration.roundOne"
        : "stats.conditions.duration.roundMany",
      { count: rounds },
    );
  } else if (condition.durationType === "encounter") {
    duration = t("stats.conditions.duration.encounter");
  } else if (condition.durationType === "rest") {
    duration = t("stats.conditions.duration.rest");
  }

  if (automatic && duration) return `${automatic} · ${duration}`;
  return automatic ?? duration;
}

export function getConditionDisplayName(
  condition: StatTokenCondition,
  label = condition.label,
): string {
  const value = typeof condition.value === "number" ? ` + ${condition.value}` : "";
  return `${label}${value}`;
}
