import type {
  StatConditionDefinition,
  StatConditionDurationType,
  StatConditionEffect,
  StatConditionTokenDisplayMode,
  StatTrackerVisibility,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function condition(
  id: string,
  label: string,
  severityType: StatConditionDefinition["severityType"],
  iconId: string,
  category: StatConditionDefinition["category"],
  description?: string,
  effects?: StatConditionEffect[],
): StatConditionDefinition {
  return {
    id,
    label,
    shortLabel: label,
    description,
    severityType,
    iconId,
    category,
    effects,
  };
}

/**
 * Public catalogue shown in the condition picker.
 * Keep labels aligned with src/features/stats/assets/condition/FR/*.png.
 */
export const STAT_CONDITION_DEFINITIONS: StatConditionDefinition[] = [
  condition("accelere", "Accéléré", "none", "counter", "movement", "Le token agit plus rapidement."),
  condition("amical", "Amical", "none", "toggle", "mental", "Le token est actuellement amical."),
  condition("aveugle", "Aveuglé", "none", "other", "sensory", "Le token ne voit pas correctement."),
  condition("blesse", "Blessé", "value", "heart", "physical", "Le token porte une blessure persistante."),
  condition("controle", "Contrôlé", "none", "magic", "magical", "Le token est sous le contrôle d'un effet extérieur."),
  condition("draine", "Drainé", "value", "heart", "physical", "Le token est affaibli par un effet de drainage."),
  condition("effraye", "Effrayé", "value", "toggle", "mental", "Le token subit une peur graduée."),
  condition("empoigne", "Empoigné", "none", "toggle", "combat", "Le token est maintenu ou agrippé."),
  condition("ensorcele", "Ensorcelé", "none", "magic", "magical", "Le token est affecté par un enchantement."),
  condition("fatigue", "Fatigué", "none", "toggle", "physical", "Le token souffre de fatigue."),
  condition("immobilise", "Immobilisé", "none", "trap", "movement", "Le token ne peut pas se déplacer librement."),
  condition("inconscient", "Inconscient", "none", "heart", "physical", "Le token est inconscient ou hors d'état d'agir."),
  condition("invisible", "Invisible", "none", "magic", "magical", "Le token est difficile ou impossible à voir."),
  condition("malade", "Malade", "value", "toggle", "physical", "Le token subit une maladie ou un malaise gradué."),
  condition("marque-du-chasseur", "Marque du chasseur", "none", "trap", "combat", "Le token est désigné comme cible par une marque de chasseur."),
  condition("mort", "Mort", "none", "heart", "physical", "Le token est mort."),
  condition("paralyse", "Paralysé", "none", "toggle", "physical", "Le token est paralysé."),
  condition("petrifie", "Pétrifié", "none", "armor", "magical", "Le token est pétrifié."),
  condition("sourd", "Sourd", "none", "other", "sensory", "Le token n'entend pas correctement."),
  condition("etourdi", "Étourdi", "value", "magic", "mental", "Le token est étourdi pour une durée ou une valeur donnée."),
];

/**
 * Definitions retained only so old room metadata remains readable.
 * They are deliberately absent from getStatConditionDefinitions().
 */
const LEGACY_CONDITION_DEFINITIONS: StatConditionDefinition[] = [
  condition("a-terre", "À terre", "none", "trap", "movement"),
  condition("agrippe", "Agrippé", "none", "toggle", "physical"),
  condition("assourdi", "Assourdi", "none", "other", "sensory"),
  condition("confus", "Confus", "none", "magic", "mental"),
  condition("ebloui", "Ébloui", "none", "magic", "sensory"),
  condition("empoisonne", "Empoisonné", "value", "toggle", "physical"),
  condition("enchevetre", "Enchevêtré", "none", "trap", "movement"),
  condition("fascine", "Fasciné", "none", "magic", "mental"),
  condition("fuite", "Fuite", "none", "toggle", "mental"),
  condition("ralenti", "Ralenti", "value", "counter", "movement"),
  condition("rapide", "Rapide", "value", "counter", "movement"),
  condition("saisi", "Saisi", "none", "toggle", "combat"),
  condition("stupefie", "Stupéfié", "value", "magic", "mental"),
];

const ALL_CONDITION_DEFINITIONS = [
  ...STAT_CONDITION_DEFINITIONS,
  ...LEGACY_CONDITION_DEFINITIONS,
];

const CONDITION_BY_ID = new Map(
  ALL_CONDITION_DEFINITIONS.map((definition) => [definition.id, definition]),
);

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const CONDITION_BY_LABEL = new Map(
  ALL_CONDITION_DEFINITIONS.map((definition) => [
    normalizeLabel(definition.label),
    definition,
  ]),
);

export function getStatConditionDefinitions(): StatConditionDefinition[] {
  return STAT_CONDITION_DEFINITIONS;
}

export function getStatConditionDefinition(
  conditionId: string,
): StatConditionDefinition | undefined {
  return CONDITION_BY_ID.get(conditionId) ?? CONDITION_BY_LABEL.get(normalizeLabel(conditionId));
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
  visibility?: StatTrackerVisibility;
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

const TRACKER_VISIBILITIES = new Set<StatTrackerVisibility>([
  "gm",
  "private",
  "public",
]);

function normalizeVisibility(value: unknown): StatTrackerVisibility {
  return typeof value === "string" &&
    TRACKER_VISIBILITIES.has(value as StatTrackerVisibility)
    ? (value as StatTrackerVisibility)
    : "public";
}

function normalizeTokenDisplayMode(
  value: unknown,
): StatConditionTokenDisplayMode {
  return typeof value === "string" &&
    TOKEN_DISPLAY_MODES.has(value as StatConditionTokenDisplayMode)
    ? (value as StatConditionTokenDisplayMode)
    : "icon";
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
    tokenDisplayMode: showOnToken ? "icon" : tokenDisplayMode,
    tokenDisplayPriority: normalizeTokenDisplayPriority(record.tokenDisplayPriority),
    visibility: normalizeVisibility(record.visibility),
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
  return token.conditions.some((activeCondition) => activeCondition.conditionId === conditionId);
}

function disableOtherTokenConditions(
  conditions: StatTokenCondition[],
  keepId: string,
  timestamp: string,
): StatTokenCondition[] {
  return conditions.map((activeCondition) =>
    activeCondition.id !== keepId && activeCondition.showOnToken
      ? {
          ...activeCondition,
          showOnToken: false,
          updatedAt: timestamp,
        }
      : activeCondition,
  );
}

export function addConditionToToken(
  token: StatTrackedToken,
  conditionId: string,
  input?: number | StatTokenConditionInput,
): StatTrackedToken {
  if (hasCondition(token, conditionId)) return token;

  const newCondition = createTokenCondition(conditionId, input);
  if (!newCondition) return token;

  const timestamp = now();
  const existingConditions = newCondition.showOnToken
    ? disableOtherTokenConditions(token.conditions, newCondition.id, timestamp)
    : token.conditions;

  return {
    ...token,
    conditions: [...existingConditions, newCondition],
    updatedAt: timestamp,
  };
}

export function updateTokenCondition(
  token: StatTrackedToken,
  tokenConditionId: string,
  input: StatTokenConditionInput,
): StatTrackedToken {
  const timestamp = now();
  let selectedForToken = false;

  const conditions = token.conditions.map((activeCondition) => {
    if (activeCondition.id !== tokenConditionId) return activeCondition;

    const definition = getStatConditionDefinition(activeCondition.conditionId);
    if (!definition) return activeCondition;

    const normalized = normalizeConditionInput(definition, input);
    selectedForToken = normalized.showOnToken === true;

    return {
      ...activeCondition,
      ...normalized,
      updatedAt: timestamp,
    };
  });

  return {
    ...token,
    conditions: selectedForToken
      ? disableOtherTokenConditions(conditions, tokenConditionId, timestamp)
      : conditions,
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
    conditions: token.conditions.map((activeCondition) =>
      activeCondition.id === tokenConditionId && activeCondition.durationType === "rounds"
        ? {
            ...activeCondition,
            remainingRounds: Math.max(0, (activeCondition.remainingRounds ?? 0) - 1),
            updatedAt: timestamp,
          }
        : activeCondition,
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
    conditions: token.conditions.map((activeCondition) =>
      activeCondition.id === tokenConditionId
        ? {
            ...activeCondition,
            durationType: undefined,
            durationValue: undefined,
            remainingRounds: undefined,
            updatedAt: timestamp,
          }
        : activeCondition,
    ),
    updatedAt: timestamp,
  };
}

export function removeConditionFromToken(
  token: StatTrackedToken,
  tokenConditionId: string,
): StatTrackedToken {
  return {
    ...token,
    conditions: token.conditions.filter((activeCondition) => activeCondition.id !== tokenConditionId),
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
  visibility: StatTrackerVisibility;
};

function getConditionValueLabel(activeCondition: StatTokenCondition): string {
  return typeof activeCondition.value === "number"
    ? `${activeCondition.shortLabel} ${activeCondition.value}`
    : activeCondition.shortLabel;
}

function getConditionDurationLabel(activeCondition: StatTokenCondition): string | undefined {
  if (activeCondition.durationType === "rounds") return `${activeCondition.remainingRounds ?? 0}r`;
  if (activeCondition.durationType === "encounter") return "rencontre";
  if (activeCondition.durationType === "rest") return "repos";
  return undefined;
}

export function getConditionTokenDisplayLabel(
  activeCondition: StatTokenCondition,
): string {
  return getConditionValueLabel(activeCondition);
}

export function getConditionTokenDisplayTitle(
  activeCondition: StatTokenCondition,
): string {
  const definition = getStatConditionDefinition(activeCondition.conditionId);
  const effectSummary = definition
    ? getConditionEffectSummary(definition, activeCondition)
    : undefined;

  return [
    activeCondition.label,
    getConditionDurationLabel(activeCondition),
    activeCondition.source ? `Source: ${activeCondition.source}` : undefined,
    activeCondition.note,
    effectSummary ? `Effets: ${effectSummary}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** At most one condition may own the image ring around a token. */
export function getTokenDisplayConditions(
  token: Pick<StatTrackedToken, "conditions">,
): StatTokenCondition[] {
  return token.conditions
    .filter(
      (activeCondition) =>
        activeCondition.showOnToken === true && activeCondition.tokenDisplayMode !== "hidden",
    )
    .sort(
      (a, b) =>
        (a.tokenDisplayPriority ?? 50) - (b.tokenDisplayPriority ?? 50) ||
        a.shortLabel.localeCompare(b.shortLabel, "fr"),
    )
    .slice(0, 1);
}

export function getTokenConditionDisplayItems(
  token: Pick<StatTrackedToken, "conditions">,
): StatConditionTokenDisplayItem[] {
  return getTokenDisplayConditions(token).map((activeCondition) => ({
    id: activeCondition.id,
    conditionId: activeCondition.conditionId,
    label: getConditionTokenDisplayLabel(activeCondition),
    title: getConditionTokenDisplayTitle(activeCondition),
    iconId: activeCondition.iconId,
    mode: "icon",
    priority: activeCondition.tokenDisplayPriority ?? 50,
    visibility: activeCondition.visibility ?? "public",
  }));
}

function enforceSingleDisplayOnNormalizedConditions(
  conditions: StatTokenCondition[],
): StatTokenCondition[] {
  const displayed = conditions
    .filter((activeCondition) => activeCondition.showOnToken)
    .sort(
      (a, b) =>
        (a.tokenDisplayPriority ?? 50) - (b.tokenDisplayPriority ?? 50) ||
        a.createdAt.localeCompare(b.createdAt),
    );
  const keepId = displayed[0]?.id;
  if (!keepId || displayed.length <= 1) return conditions;

  return conditions.map((activeCondition) =>
    activeCondition.showOnToken && activeCondition.id !== keepId
      ? { ...activeCondition, showOnToken: false }
      : activeCondition,
  );
}

export function normalizeTokenConditions(value: unknown): StatTokenCondition[] {
  if (!Array.isArray(value)) return [];

  const normalized = value.flatMap((entry) => {
    if (typeof entry === "string") {
      const definition = getStatConditionDefinition(entry);
      const activeCondition = definition ? createTokenCondition(definition.id) : null;
      return activeCondition ? [activeCondition] : [];
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
        ? getStatConditionDefinition(rawLabel)
        : undefined;

    if (!definition) return [];

    const timestamp = now();
    const normalizedInput = normalizeConditionInput(definition, {
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
      visibility: normalizeVisibility(record.visibility),
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
        ...normalizedInput,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : timestamp,
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : timestamp,
      },
    ];
  }).filter(
    (activeCondition, index, conditions) =>
      conditions.findIndex(
        (candidate) => candidate.conditionId === activeCondition.conditionId,
      ) === index,
  );

  return enforceSingleDisplayOnNormalizedConditions(normalized);
}
