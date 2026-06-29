import type {
  StatConditionDefinition,
  StatConditionDurationType,
  StatConditionEffect,
  StatConditionTokenDisplayMode,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

export const STAT_CONDITION_DEFINITIONS: StatConditionDefinition[] = [
  {
    id: "a-terre",
    label: "À terre",
    shortLabel: "À terre",
    description: "Le token est au sol ou renversé.",
    severityType: "none",
    iconId: "trap",
    category: "movement",
    effects: [
      {
        id: "posture-info",
        label: "Posture vulnérable",
        shortLabel: "Posture",
        target: "other",
        mode: "informational",
        description: "Rappel tactique : posture au sol à prendre en compte manuellement.",
      },
    ],
  },
  {
    id: "agrippe",
    label: "Agrippé",
    shortLabel: "Agrippé",
    description: "Le token est maintenu par une créature ou un effet.",
    severityType: "none",
    iconId: "toggle",
    category: "physical",
    effects: [
      {
        id: "movement-restricted",
        label: "Mouvement restreint",
        shortLabel: "Mvt rest.",
        target: "speed",
        mode: "informational",
        description: "Rappel : le mouvement peut être limité selon la scène ou la règle utilisée.",
      },
    ],
  },
  {
    id: "assourdi",
    label: "Assourdi",
    shortLabel: "Assourdi",
    description: "Le token entend difficilement ou plus du tout.",
    severityType: "none",
    iconId: "other",
    category: "sensory",
    effects: [
      {
        id: "sensory-info",
        label: "Perception sensorielle limitée",
        shortLabel: "Sens",
        target: "perception",
        mode: "informational",
        description: "Rappel descriptif : la perception liée au sens affecté doit être évaluée manuellement.",
      },
    ],
  },
  {
    id: "aveugle",
    label: "Aveuglé",
    shortLabel: "Aveuglé",
    description: "Le token ne voit pas correctement.",
    severityType: "none",
    iconId: "other",
    category: "sensory",
    effects: [
      {
        id: "visibility-limited",
        label: "Visibilité limitée",
        shortLabel: "Visibilité",
        target: "visibility",
        mode: "informational",
        description: "Rappel descriptif : gérer les cibles et tests associés manuellement.",
      },
    ],
  },
  {
    id: "blesse",
    label: "Blessé",
    shortLabel: "Blessé",
    description: "Le token porte une blessure persistante ou notable.",
    severityType: "value",
    iconId: "heart",
    category: "physical",
  },
  {
    id: "confus",
    label: "Confus",
    shortLabel: "Confus",
    description: "Le token agit de façon désorientée.",
    severityType: "none",
    iconId: "magic",
    category: "mental",
    effects: [
      {
        id: "mental-info",
        label: "Contrôle mental perturbé",
        shortLabel: "Mental",
        target: "other",
        mode: "informational",
        description: "Rappel descriptif : l’état mental influence les décisions et réactions manuellement.",
      },
    ],
  },
  {
    id: "controle",
    label: "Contrôlé",
    shortLabel: "Contrôlé",
    description: "Le token est sous le contrôle d'un effet extérieur.",
    severityType: "none",
    iconId: "magic",
    category: "magical",
    effects: [
      {
        id: "control-info",
        label: "Contrôle externe",
        shortLabel: "Contrôle",
        target: "actions",
        mode: "informational",
        description: "Rappel descriptif : les actions peuvent dépendre d’un effet de contrôle.",
      },
    ],
  },
  {
    id: "ebloui",
    label: "Ébloui",
    shortLabel: "Ébloui",
    description: "Le token est gêné par une lumière ou un éclat.",
    severityType: "none",
    iconId: "magic",
    category: "sensory",
  },
  {
    id: "effraye",
    label: "Effrayé",
    shortLabel: "Effrayé",
    description: "Le token subit une peur graduée.",
    severityType: "value",
    iconId: "toggle",
    category: "mental",
    effects: [
      {
        id: "status-penalty-checks",
        label: "Malus de statut aux tests",
        shortLabel: "Statut",
        target: "skill-check",
        mode: "status-penalty",
        scalesWithConditionValue: true,
        description: "Malus descriptif basé sur la valeur de la condition. Non appliqué automatiquement.",
      },
      {
        id: "status-penalty-dc",
        label: "Malus de statut aux DD",
        shortLabel: "DD",
        target: "other",
        mode: "status-penalty",
        scalesWithConditionValue: true,
        description: "Rappel descriptif pour les DD concernés. Non appliqué automatiquement.",
      },
    ],
  },
  {
    id: "empoisonne",
    label: "Empoisonné",
    shortLabel: "Empoisonné",
    description: "Le token subit un poison ou une toxine.",
    severityType: "value",
    iconId: "toggle",
    category: "physical",
  },
  {
    id: "enchevetre",
    label: "Enchevêtré",
    shortLabel: "Enchevêtré",
    description: "Les mouvements du token sont gênés.",
    severityType: "none",
    iconId: "trap",
    category: "movement",
    effects: [
      {
        id: "speed-info",
        label: "Déplacement gêné",
        shortLabel: "Vitesse",
        target: "speed",
        mode: "informational",
        description: "Rappel descriptif : vitesse ou déplacement à ajuster manuellement.",
      },
    ],
  },
  {
    id: "fascine",
    label: "Fasciné",
    shortLabel: "Fasciné",
    description: "L'attention du token est captée par une cible.",
    severityType: "none",
    iconId: "magic",
    category: "mental",
  },
  {
    id: "fatigue",
    label: "Fatigué",
    shortLabel: "Fatigué",
    description: "Le token souffre d'épuisement ou de fatigue.",
    severityType: "value",
    iconId: "toggle",
    category: "physical",
    effects: [
      {
        id: "fatigue-info",
        label: "Fatigue à gérer manuellement",
        shortLabel: "Fatigue",
        target: "other",
        mode: "informational",
        description: "Rappel descriptif : appliquer les conséquences selon le système utilisé.",
      },
    ],
  },
  {
    id: "fuite",
    label: "Fuite",
    shortLabel: "Fuite",
    description: "Le token cherche à fuir la menace.",
    severityType: "none",
    iconId: "toggle",
    category: "mental",
  },
  {
    id: "immobilise",
    label: "Immobilisé",
    shortLabel: "Immobilisé",
    description: "Le token ne peut pas se déplacer librement.",
    severityType: "none",
    iconId: "trap",
    category: "movement",
    effects: [
      {
        id: "speed-disabled",
        label: "Déplacement bloqué",
        shortLabel: "Vitesse off",
        target: "speed",
        mode: "disable",
        description: "Rappel descriptif : déplacement à gérer manuellement.",
      },
    ],
  },
  {
    id: "inconscient",
    label: "Inconscient",
    shortLabel: "Inconscient",
    description: "Le token est inconscient ou hors d'état d'agir.",
    severityType: "none",
    iconId: "heart",
    category: "physical",
  },
  {
    id: "invisible",
    label: "Invisible",
    shortLabel: "Invisible",
    description: "Le token est difficile ou impossible à voir.",
    severityType: "none",
    iconId: "magic",
    category: "magical",
    effects: [
      {
        id: "visibility-info",
        label: "Visibilité altérée",
        shortLabel: "Visibilité",
        target: "visibility",
        mode: "informational",
        description: "Rappel descriptif : la visibilité doit être traitée manuellement.",
      },
    ],
  },
  {
    id: "malade",
    label: "Malade",
    shortLabel: "Malade",
    description: "Le token subit une maladie ou un malaise gradué.",
    severityType: "value",
    iconId: "toggle",
    category: "physical",
    effects: [
      {
        id: "status-penalty-saves",
        label: "Malus de statut aux jets",
        shortLabel: "Statut",
        target: "saving-throw",
        mode: "status-penalty",
        scalesWithConditionValue: true,
        description: "Malus descriptif basé sur la valeur de la condition. Non appliqué automatiquement.",
      },
    ],
  },
  {
    id: "ralenti",
    label: "Ralenti",
    shortLabel: "Ralenti",
    description: "Le token dispose de moins d'actions ou agit plus lentement.",
    severityType: "value",
    iconId: "counter",
    category: "movement",
    effects: [
      {
        id: "actions-reduced",
        label: "Actions réduites",
        shortLabel: "Actions",
        target: "actions",
        mode: "circumstance-penalty",
        scalesWithConditionValue: true,
        description: "Rappel descriptif : ajustement manuel des actions selon la valeur.",
      },
    ],
  },
  {
    id: "rapide",
    label: "Rapide",
    shortLabel: "Rapide",
    description: "Le token gagne une action ou agit plus vite.",
    severityType: "value",
    iconId: "counter",
    category: "movement",
    effects: [
      {
        id: "actions-bonus",
        label: "Actions supplémentaires",
        shortLabel: "Actions",
        target: "actions",
        mode: "circumstance-bonus",
        scalesWithConditionValue: true,
        description: "Rappel descriptif : actions supplémentaires à gérer manuellement.",
      },
    ],
  },
  {
    id: "saisi",
    label: "Saisi",
    shortLabel: "Saisi",
    description: "Le token est tenu ou retenu brièvement.",
    severityType: "none",
    iconId: "toggle",
    category: "combat",
    effects: [
      {
        id: "movement-restricted",
        label: "Mouvement restreint",
        shortLabel: "Mvt rest.",
        target: "speed",
        mode: "informational",
        description: "Rappel descriptif : mouvement ou actions physiques à gérer manuellement.",
      },
    ],
  },
  {
    id: "stupefie",
    label: "Stupéfié",
    shortLabel: "Stupéfié",
    description: "Le token subit une stupeur graduée.",
    severityType: "value",
    iconId: "magic",
    category: "mental",
    effects: [
      {
        id: "mental-actions",
        label: "Actions mentales perturbées",
        shortLabel: "Mental",
        target: "actions",
        mode: "informational",
        scalesWithConditionValue: true,
        description: "Rappel descriptif : conséquences à gérer manuellement selon la valeur.",
      },
    ],
  },
];

const CONDITION_BY_ID = new Map(
  STAT_CONDITION_DEFINITIONS.map((condition) => [condition.id, condition]),
);

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getStatConditionDefinitions(): StatConditionDefinition[] {
  return STAT_CONDITION_DEFINITIONS;
}

export function getStatConditionDefinition(
  conditionId: string,
): StatConditionDefinition | undefined {
  return CONDITION_BY_ID.get(conditionId);
}

export function getConditionEffects(conditionId: string): StatConditionEffect[] {
  return getStatConditionDefinition(conditionId)?.effects ?? [];
}

function getEffectValue(
  effect: StatConditionEffect,
  activeCondition?: StatTokenCondition,
): number | undefined {
  if (effect.scalesWithConditionValue) {
    return activeCondition?.value ?? effect.value ?? 1;
  }

  return effect.value;
}

export function getConditionEffectBadgeLabel(
  effect: StatConditionEffect,
  activeCondition?: StatTokenCondition,
): string {
  const value = getEffectValue(effect, activeCondition);

  if (effect.mode === "disable") return `${effect.shortLabel} off`;
  if (effect.mode === "informational") return effect.shortLabel || "Info";
  if (typeof value !== "number") return effect.shortLabel;

  const sign = effect.mode.includes("penalty") ? "-" : "+";
  return `${effect.shortLabel} ${sign}${Math.abs(value)}`;
}

export function getConditionEffectSummary(
  definition: StatConditionDefinition,
  activeCondition?: StatTokenCondition,
): string {
  return (definition.effects ?? [])
    .map((effect) => getConditionEffectBadgeLabel(effect, activeCondition))
    .join(" · ");
}

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
};

const DURATION_TYPES = new Set<StatConditionDurationType>([
  "manual",
  "rounds",
  "encounter",
  "rest",
]);

const TOKEN_DISPLAY_MODES = new Set<StatConditionTokenDisplayMode>([
  "badge",
  "icon",
  "hidden",
]);

function normalizeTokenDisplayMode(
  value: unknown,
): StatConditionTokenDisplayMode {
  return typeof value === "string" &&
    TOKEN_DISPLAY_MODES.has(value as StatConditionTokenDisplayMode)
    ? (value as StatConditionTokenDisplayMode)
    : "badge";
}

function normalizeTokenDisplayPriority(value: unknown): number {
  const number = normalizeNonNegativeInteger(value);
  if (number === undefined) return 50;
  return Math.min(100, Math.max(0, number));
}

function cleanOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeNonNegativeInteger(value: unknown): number | undefined {
  const number = normalizeNumber(value);
  if (number === undefined) return undefined;
  return Math.max(0, Math.floor(number));
}

function normalizeConditionInput(
  definition: StatConditionDefinition,
  input?: number | StatTokenConditionInput,
): Omit<
  StatTokenCondition,
  "id" | "conditionId" | "label" | "shortLabel" | "iconId" | "createdAt" | "updatedAt"
> {
  const record: StatTokenConditionInput =
    typeof input === "number" ? { value: input } : input ?? {};
  const value =
    definition.severityType === "none"
      ? undefined
      : normalizeNumber(record.value) ?? 1;
  const durationType = DURATION_TYPES.has(record.durationType as StatConditionDurationType)
    ? record.durationType
    : undefined;
  const durationValue = normalizeNonNegativeInteger(record.durationValue);
  const requestedRounds = normalizeNonNegativeInteger(record.remainingRounds);
  const remainingRounds =
    durationType === "rounds" ? requestedRounds ?? durationValue ?? 1 : undefined;
  const tokenDisplayMode = normalizeTokenDisplayMode(record.tokenDisplayMode);
  const showOnToken = tokenDisplayMode === "hidden"
    ? false
    : record.showOnToken ?? false;

  return {
    value,
    durationType,
    durationValue: durationType === "rounds" ? durationValue ?? remainingRounds : undefined,
    remainingRounds,
    source: cleanOptionalText(record.source),
    note: cleanOptionalText(record.note),
    showOnToken,
    tokenDisplayMode,
    tokenDisplayPriority: normalizeTokenDisplayPriority(record.tokenDisplayPriority),
  };
}

export function createTokenCondition(
  conditionId: string,
  input?: number | StatTokenConditionInput,
): StatTokenCondition | null {
  const definition = getStatConditionDefinition(conditionId);
  if (!definition) return null;

  const timestamp = now();

  return {
    id: createId("stat-condition"),
    conditionId: definition.id,
    label: definition.label,
    shortLabel: definition.shortLabel,
    iconId: definition.iconId,
    ...normalizeConditionInput(definition, input),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function hasCondition(
  token: Pick<StatTrackedToken, "conditions">,
  conditionId: string,
): boolean {
  return token.conditions.some((condition) => condition.conditionId === conditionId);
}

export function addConditionToToken(
  token: StatTrackedToken,
  conditionId: string,
  input?: number | StatTokenConditionInput,
): StatTrackedToken {
  if (hasCondition(token, conditionId)) return token;

  const condition = createTokenCondition(conditionId, input);
  if (!condition) return token;

  return {
    ...token,
    conditions: [...token.conditions, condition],
    updatedAt: now(),
  };
}

export function updateTokenCondition(
  token: StatTrackedToken,
  tokenConditionId: string,
  input: StatTokenConditionInput,
): StatTrackedToken {
  return {
    ...token,
    conditions: token.conditions.map((condition) => {
      if (condition.id !== tokenConditionId) return condition;

      const definition = getStatConditionDefinition(condition.conditionId);
      if (!definition) return condition;

      return {
        ...condition,
        ...normalizeConditionInput(definition, input),
        updatedAt: now(),
      };
    }),
    updatedAt: now(),
  };
}

export function decrementTokenConditionDuration(
  token: StatTrackedToken,
  tokenConditionId: string,
): StatTrackedToken {
  return {
    ...token,
    conditions: token.conditions.map((condition) =>
      condition.id === tokenConditionId && condition.durationType === "rounds"
        ? {
            ...condition,
            remainingRounds: Math.max(0, (condition.remainingRounds ?? 0) - 1),
            updatedAt: now(),
          }
        : condition,
    ),
    updatedAt: now(),
  };
}

export function clearTokenConditionDuration(
  token: StatTrackedToken,
  tokenConditionId: string,
): StatTrackedToken {
  return {
    ...token,
    conditions: token.conditions.map((condition) =>
      condition.id === tokenConditionId
        ? {
            ...condition,
            durationType: undefined,
            durationValue: undefined,
            remainingRounds: undefined,
            updatedAt: now(),
          }
        : condition,
    ),
    updatedAt: now(),
  };
}

export function removeConditionFromToken(
  token: StatTrackedToken,
  tokenConditionId: string,
): StatTrackedToken {
  return {
    ...token,
    conditions: token.conditions.filter((condition) => condition.id !== tokenConditionId),
    updatedAt: now(),
  };
}


export type StatConditionTokenDisplayItem = {
  id: string;
  conditionId: string;
  label: string;
  title: string;
  iconId: string;
  mode: StatConditionTokenDisplayMode;
  priority: number;
};

function getConditionValueLabel(condition: StatTokenCondition): string {
  return typeof condition.value === "number"
    ? `${condition.shortLabel} ${condition.value}`
    : condition.shortLabel;
}

function getConditionDurationLabel(condition: StatTokenCondition): string | undefined {
  if (condition.durationType === "rounds") return `${condition.remainingRounds ?? 0}r`;
  if (condition.durationType === "encounter") return "rencontre";
  if (condition.durationType === "rest") return "repos";
  return undefined;
}

export function getConditionTokenDisplayLabel(
  condition: StatTokenCondition,
): string {
  return getConditionValueLabel(condition);
}

export function getConditionTokenDisplayTitle(
  condition: StatTokenCondition,
): string {
  const definition = getStatConditionDefinition(condition.conditionId);
  const effectSummary = definition
    ? getConditionEffectSummary(definition, condition)
    : undefined;

  return [
    condition.label,
    getConditionDurationLabel(condition),
    condition.source ? `Source: ${condition.source}` : undefined,
    condition.note,
    effectSummary ? `Effets: ${effectSummary}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function getTokenDisplayConditions(
  token: Pick<StatTrackedToken, "conditions">,
): StatTokenCondition[] {
  return token.conditions
    .filter(
      (condition) =>
        condition.showOnToken === true && condition.tokenDisplayMode !== "hidden",
    )
    .sort(
      (a, b) =>
        (a.tokenDisplayPriority ?? 50) - (b.tokenDisplayPriority ?? 50) ||
        a.shortLabel.localeCompare(b.shortLabel, "fr"),
    );
}

export function getTokenConditionDisplayItems(
  token: Pick<StatTrackedToken, "conditions">,
): StatConditionTokenDisplayItem[] {
  return getTokenDisplayConditions(token).map((condition) => ({
    id: condition.id,
    conditionId: condition.conditionId,
    label: getConditionTokenDisplayLabel(condition),
    title: getConditionTokenDisplayTitle(condition),
    iconId: condition.iconId,
    mode: condition.tokenDisplayMode ?? "badge",
    priority: condition.tokenDisplayPriority ?? 50,
  }));
}

export function normalizeTokenConditions(value: unknown): StatTokenCondition[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      const definition = CONDITION_BY_ID.get(normalizeLabel(entry));
      const condition = definition ? createTokenCondition(definition.id) : null;
      return condition ? [condition] : [];
    }

    if (typeof entry !== "object" || entry === null) return [];

    const record = entry as Record<string, unknown>;
    const rawConditionId =
      typeof record.conditionId === "string"
        ? record.conditionId
        : typeof record.id === "string"
          ? record.id
          : undefined;
    const rawLabel =
      typeof record.label === "string"
        ? record.label
        : typeof record.name === "string"
          ? record.name
          : undefined;
    const definition = rawConditionId
      ? getStatConditionDefinition(rawConditionId)
      : rawLabel
        ? getStatConditionDefinition(normalizeLabel(rawLabel))
        : undefined;

    if (!definition) return [];

    const timestamp = now();
    const normalized = normalizeConditionInput(definition, {
      value: normalizeNumber(record.value),
      durationType:
        typeof record.durationType === "string" &&
        DURATION_TYPES.has(record.durationType as StatConditionDurationType)
          ? (record.durationType as StatConditionDurationType)
          : undefined,
      durationValue: normalizeNonNegativeInteger(record.durationValue),
      remainingRounds: normalizeNonNegativeInteger(record.remainingRounds),
      source: cleanOptionalText(record.source),
      note: cleanOptionalText(record.note),
      showOnToken: typeof record.showOnToken === "boolean" ? record.showOnToken : undefined,
      tokenDisplayMode:
        typeof record.tokenDisplayMode === "string"
          ? (record.tokenDisplayMode as StatConditionTokenDisplayMode)
          : undefined,
      tokenDisplayPriority: normalizeTokenDisplayPriority(record.tokenDisplayPriority),
    });

    return [
      {
        id:
          typeof record.id === "string" && record.conditionId
            ? record.id
            : createId("stat-condition"),
        conditionId: definition.id,
        label: definition.label,
        shortLabel: definition.shortLabel,
        iconId: definition.iconId,
        ...normalized,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : timestamp,
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : timestamp,
      },
    ];
  }).filter((condition, index, conditions) =>
    conditions.findIndex((item) => item.conditionId === condition.conditionId) === index,
  );
}
