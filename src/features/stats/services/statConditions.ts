import type {
  StatConditionDefinition,
  StatConditionDurationType,
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
  },
  {
    id: "agrippe",
    label: "Agrippé",
    shortLabel: "Agrippé",
    description: "Le token est maintenu par une créature ou un effet.",
    severityType: "none",
    iconId: "toggle",
    category: "physical",
  },
  {
    id: "assourdi",
    label: "Assourdi",
    shortLabel: "Assourdi",
    description: "Le token entend difficilement ou plus du tout.",
    severityType: "none",
    iconId: "other",
    category: "sensory",
  },
  {
    id: "aveugle",
    label: "Aveuglé",
    shortLabel: "Aveuglé",
    description: "Le token ne voit pas correctement.",
    severityType: "none",
    iconId: "other",
    category: "sensory",
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
  },
  {
    id: "controle",
    label: "Contrôlé",
    shortLabel: "Contrôlé",
    description: "Le token est sous le contrôle d'un effet extérieur.",
    severityType: "none",
    iconId: "magic",
    category: "magical",
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
  },
  {
    id: "malade",
    label: "Malade",
    shortLabel: "Malade",
    description: "Le token subit une maladie ou un malaise gradué.",
    severityType: "value",
    iconId: "toggle",
    category: "physical",
  },
  {
    id: "ralenti",
    label: "Ralenti",
    shortLabel: "Ralenti",
    description: "Le token dispose de moins d'actions ou agit plus lentement.",
    severityType: "value",
    iconId: "counter",
    category: "movement",
  },
  {
    id: "rapide",
    label: "Rapide",
    shortLabel: "Rapide",
    description: "Le token gagne une action ou agit plus vite.",
    severityType: "value",
    iconId: "counter",
    category: "movement",
  },
  {
    id: "saisi",
    label: "Saisi",
    shortLabel: "Saisi",
    description: "Le token est tenu ou retenu brièvement.",
    severityType: "none",
    iconId: "toggle",
    category: "combat",
  },
  {
    id: "stupefie",
    label: "Stupéfié",
    shortLabel: "Stupéfié",
    description: "Le token subit une stupeur graduée.",
    severityType: "value",
    iconId: "magic",
    category: "mental",
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

export type StatTokenConditionInput = {
  value?: number;
  durationType?: StatConditionDurationType;
  durationValue?: number;
  remainingRounds?: number;
  source?: string;
  note?: string;
};

const DURATION_TYPES = new Set<StatConditionDurationType>([
  "manual",
  "rounds",
  "encounter",
  "rest",
]);

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

  return {
    value,
    durationType,
    durationValue: durationType === "rounds" ? durationValue ?? remainingRounds : undefined,
    remainingRounds,
    source: cleanOptionalText(record.source),
    note: cleanOptionalText(record.note),
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
