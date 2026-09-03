import type { GameSystemPreference } from "../../../core/config/appOptions";
import type { TranslateFunction } from "../../../i18n/types";
import type {
  StatConditionDefinition,
  StatConditionSeverity,
} from "../statTypes";

type ActiveGameSystem = Exclude<GameSystemPreference, "GENERIC">;

type StatConditionCatalogEntry = {
  id: string;
  systems: readonly ActiveGameSystem[];
  labelKey: string;
  labelKeyBySystem?: Partial<Record<ActiveGameSystem, string>>;
  severity: Partial<Record<ActiveGameSystem, StatConditionSeverity>>;
  maxValue?: Partial<Record<ActiveGameSystem, number>>;
  valueLabelKey?: string;
};

export type SystemStatConditionDefinition = StatConditionDefinition & {
  system: ActiveGameSystem;
  maxValue?: number;
  valueLabelKey?: string;
  rulesSummary: string;
};

const DND5E = "DND5E" as const;
const PF2E = "PF2E" as const;
const BOTH = [DND5E, PF2E] as const;
const DND_ONLY = [DND5E] as const;
const PF_ONLY = [PF2E] as const;

function condition(
  id: string,
  systems: readonly ActiveGameSystem[],
  severity: Partial<Record<ActiveGameSystem, StatConditionSeverity>>,
  options?: {
    labelKeyBySystem?: Partial<Record<ActiveGameSystem, string>>;
    maxValue?: Partial<Record<ActiveGameSystem, number>>;
    valueLabelKey?: string;
  },
): StatConditionCatalogEntry {
  return {
    id,
    systems,
    labelKey: `stats.conditions.catalog.${id}`,
    severity,
    ...options,
  };
}

/** Runtime index derived from docs/stats/CONDITIONS_MASTER_CATALOG_V1.md. */
export const STAT_CONDITION_CATALOG: readonly StatConditionCatalogEntry[] = [
  condition("blinded", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("deafened", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("frightened", BOTH, { DND5E: "none", PF2E: "value" }),
  condition(
    "grappled",
    BOTH,
    { DND5E: "none", PF2E: "none" },
    {
      labelKeyBySystem: {
        DND5E: "stats.conditions.catalog.grappled.dnd5e",
        PF2E: "stats.conditions.catalog.grappled.pf2e",
      },
    },
  ),
  condition("invisible", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("paralyzed", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("petrified", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("prone", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("restrained", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("stunned", BOTH, { DND5E: "none", PF2E: "value" }),
  condition("unconscious", BOTH, { DND5E: "none", PF2E: "none" }),

  condition("charmed", DND_ONLY, { DND5E: "none" }),
  condition(
    "exhaustion",
    DND_ONLY,
    { DND5E: "staged" },
    { maxValue: { DND5E: 6 } },
  ),
  condition("incapacitated", DND_ONLY, { DND5E: "none" }),
  condition("poisoned", DND_ONLY, { DND5E: "none" }),

  condition("broken", PF_ONLY, { PF2E: "none" }),
  condition("clumsy", PF_ONLY, { PF2E: "value" }),
  condition("concealed", PF_ONLY, { PF2E: "none" }),
  condition("confused", PF_ONLY, { PF2E: "none" }),
  condition("controlled", PF_ONLY, { PF2E: "none" }),
  condition("dazzled", PF_ONLY, { PF2E: "none" }),
  condition("doomed", PF_ONLY, { PF2E: "value" }),
  condition("drained", PF_ONLY, { PF2E: "value" }),
  condition("dying", PF_ONLY, { PF2E: "value" }),
  condition("encumbered", PF_ONLY, { PF2E: "none" }),
  condition("enfeebled", PF_ONLY, { PF2E: "value" }),
  condition("fascinated", PF_ONLY, { PF2E: "none" }),
  condition("fatigued", PF_ONLY, { PF2E: "none" }),
  condition("fleeing", PF_ONLY, { PF2E: "none" }),
  condition("friendly", PF_ONLY, { PF2E: "none" }),
  condition("helpful", PF_ONLY, { PF2E: "none" }),
  condition("hidden", PF_ONLY, { PF2E: "none" }),
  condition("hostile", PF_ONLY, { PF2E: "none" }),
  condition("immobilized", PF_ONLY, { PF2E: "none" }),
  condition("indifferent", PF_ONLY, { PF2E: "none" }),
  condition("observed", PF_ONLY, { PF2E: "none" }),
  condition("off_guard", PF_ONLY, { PF2E: "none" }),
  condition(
    "persistent_damage",
    PF_ONLY,
    { PF2E: "value" },
    { valueLabelKey: "stats.conditions.value.damage" },
  ),
  condition("quickened", PF_ONLY, { PF2E: "none" }),
  condition("sickened", PF_ONLY, { PF2E: "value" }),
  condition("slowed", PF_ONLY, { PF2E: "value" }),
  condition("stupefied", PF_ONLY, { PF2E: "value" }),
  condition("undetected", PF_ONLY, { PF2E: "none" }),
  condition("unfriendly", PF_ONLY, { PF2E: "none" }),
  condition("unnoticed", PF_ONLY, { PF2E: "none" }),
  condition("wounded", PF_ONLY, { PF2E: "value" }),
];

export const GENERIC_STAT_CONDITION_CATALOG: readonly StatConditionCatalogEntry[] = [];

const CANONICAL_CONDITION_IDS = new Set(
  STAT_CONDITION_CATALOG.map((entry) => entry.id),
);

export function isCanonicalStatConditionId(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_CONDITION_IDS.has(value);
}

export function getSystemStatConditionDefinitions(
  system: GameSystemPreference,
  t: TranslateFunction,
): SystemStatConditionDefinition[] {
  if (system === "GENERIC") return [];

  const definitions = STAT_CONDITION_CATALOG.filter((entry) =>
    entry.systems.includes(system),
  ).map((entry) => {
    const labelKey = entry.labelKeyBySystem?.[system] ?? entry.labelKey;
    const label = t(labelKey);

    return {
      id: entry.id,
      label,
      shortLabel: label,
      description: t(`stats.conditions.catalog.${entry.id}.description`),
      rulesSummary: t(`stats.conditions.catalog.${entry.id}.rules.${system}`),
      severityType: entry.severity[system] ?? "none",
      iconId: "object_circle",
      category: "other",
      system,
      maxValue: entry.maxValue?.[system],
      valueLabelKey: entry.valueLabelKey,
    };
  });

  return definitions.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, {
      sensitivity: "base",
      numeric: true,
    }),
  );
}

export function getSystemStatConditionDefinition(
  conditionId: string,
  system: GameSystemPreference,
  t: TranslateFunction,
): SystemStatConditionDefinition | undefined {
  if (!isCanonicalStatConditionId(conditionId)) return undefined;
  return getSystemStatConditionDefinitions(system, t).find(
    (definition) => definition.id === conditionId,
  );
}
