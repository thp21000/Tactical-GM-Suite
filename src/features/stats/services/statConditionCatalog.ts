import type { GameSystemPreference } from "../../../core/config/appOptions";
import type { TranslateFunction } from "../../../i18n/types";
import type {
  StatConditionDefinition,
  StatConditionDerivationMode,
  StatConditionSeverity,
} from "../statTypes";

type ActiveGameSystem = Exclude<GameSystemPreference, "GENERIC">;

export type StatConditionImplication = {
  conditionId: string;
  mode: StatConditionDerivationMode;
};

type StatConditionCatalogEntry = {
  id: string;
  systems: readonly ActiveGameSystem[];
  labelKey: string;
  labelKeyBySystem?: Partial<Record<ActiveGameSystem, string>>;
  severity: Partial<Record<ActiveGameSystem, StatConditionSeverity>>;
  maxValue?: Partial<Record<ActiveGameSystem, number>>;
  valueLabelKey?: string;
  implications?: Partial<Record<ActiveGameSystem, readonly StatConditionImplication[]>>;
};

export type SystemStatConditionImplication = StatConditionImplication & {
  target: Pick<
    SystemStatConditionDefinition,
    "id" | "label" | "shortLabel" | "severityType" | "iconId" | "category" | "maxValue" | "valueLabelKey"
  >;
};

export type SystemStatConditionDefinition = StatConditionDefinition & {
  system: ActiveGameSystem;
  maxValue?: number;
  valueLabelKey?: string;
  rulesSummary: string;
  implications: readonly SystemStatConditionImplication[];
};

const DND5E = "DND5E" as const;
const PF2E = "PF2E" as const;
const BOTH = [DND5E, PF2E] as const;
const DND_ONLY = [DND5E] as const;
const PF_ONLY = [PF2E] as const;

function relation(conditionId: string, mode: StatConditionDerivationMode): StatConditionImplication {
  return { conditionId, mode };
}

function condition(
  id: string,
  systems: readonly ActiveGameSystem[],
  severity: Partial<Record<ActiveGameSystem, StatConditionSeverity>>,
  options?: {
    labelKeyBySystem?: Partial<Record<ActiveGameSystem, string>>;
    maxValue?: Partial<Record<ActiveGameSystem, number>>;
    valueLabelKey?: string;
    implications?: Partial<Record<ActiveGameSystem, readonly StatConditionImplication[]>>;
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

/**
 * Runtime index derived from docs/stats/CONDITIONS_MASTER_CATALOG_V1.md.
 *
 * Only direct, unambiguous condition-to-condition rules are automated here.
 * Relative detection states (hidden/undetected/invisible) and circumstantial
 * effects are deliberately excluded because they cannot be represented safely
 * as a condition on the same token.
 */
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
      implications: {
        PF2E: [
          relation("off_guard", "while-active"),
          relation("immobilized", "while-active"),
        ],
      },
    },
  ),
  condition("invisible", BOTH, { DND5E: "none", PF2E: "none" }),
  condition("paralyzed", BOTH, { DND5E: "none", PF2E: "none" }, {
    implications: {
      DND5E: [relation("incapacitated", "while-active")],
      PF2E: [relation("off_guard", "while-active")],
    },
  }),
  condition("petrified", BOTH, { DND5E: "none", PF2E: "none" }, {
    implications: {
      DND5E: [relation("incapacitated", "while-active")],
    },
  }),
  condition("prone", BOTH, { DND5E: "none", PF2E: "none" }, {
    implications: {
      PF2E: [relation("off_guard", "while-active")],
    },
  }),
  condition("restrained", BOTH, { DND5E: "none", PF2E: "none" }, {
    implications: {
      PF2E: [
        relation("off_guard", "while-active"),
        relation("immobilized", "while-active"),
      ],
    },
  }),
  condition("stunned", BOTH, { DND5E: "none", PF2E: "value" }, {
    implications: {
      DND5E: [relation("incapacitated", "while-active")],
    },
  }),
  condition("unconscious", BOTH, { DND5E: "none", PF2E: "none" }, {
    implications: {
      DND5E: [
        relation("incapacitated", "while-active"),
        relation("prone", "on-apply"),
      ],
      PF2E: [
        relation("blinded", "while-active"),
        relation("off_guard", "while-active"),
        relation("prone", "on-apply"),
      ],
    },
  }),

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
  condition("confused", PF_ONLY, { PF2E: "none" }, {
    implications: {
      PF2E: [relation("off_guard", "while-active")],
    },
  }),
  condition("controlled", PF_ONLY, { PF2E: "none" }),
  condition("dazzled", PF_ONLY, { PF2E: "none" }),
  condition("doomed", PF_ONLY, { PF2E: "value" }),
  condition("drained", PF_ONLY, { PF2E: "value" }),
  condition("dying", PF_ONLY, { PF2E: "value" }, {
    // Losing Dying can still leave a creature Unconscious at 0 HP, so this is
    // an initial application rather than a strict while-active dependency.
    implications: {
      PF2E: [relation("unconscious", "on-apply")],
    },
  }),
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

  const entries = STAT_CONDITION_CATALOG.filter((entry) => entry.systems.includes(system));
  const baseDefinitions = entries.map((entry) => {
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
      category: "other" as const,
      system,
      maxValue: entry.maxValue?.[system],
      valueLabelKey: entry.valueLabelKey,
    };
  });
  const definitionById = new Map(baseDefinitions.map((definition) => [definition.id, definition]));

  const definitions: SystemStatConditionDefinition[] = baseDefinitions.map((definition) => {
    const entry = entries.find((candidate) => candidate.id === definition.id);
    const implications: SystemStatConditionImplication[] = [];

    for (const implication of entry?.implications?.[system] ?? []) {
      const target = definitionById.get(implication.conditionId);
      if (!target) continue;
      implications.push({
        ...implication,
        target: {
          id: target.id,
          label: target.label,
          shortLabel: target.shortLabel,
          severityType: target.severityType,
          iconId: target.iconId,
          category: target.category,
          maxValue: target.maxValue,
          valueLabelKey: target.valueLabelKey,
        },
      });
    }

    return { ...definition, implications };
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
