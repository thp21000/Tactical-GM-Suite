import { STAT_TOKEN_TYPE_LABELS } from "./statLabels";
import type {
  StatTokenType,
  StatTracker,
  StatTrackerInput,
  StatTrackerPreset,
  StatTrackerPresetMap,
  StatTrackerVisibility,
  StatTrackerVisualType,
} from "../statTypes";

export const STAT_PRESET_TOKEN_TYPES: StatTokenType[] = [
  "pc",
  "npc",
  "enemy",
  "mount",
  "object",
  "trap",
  "familiar",
  "other",
];

function now(): string {
  return new Date().toISOString();
}

function bar(
  name: string,
  iconId: string,
  current: number,
  max: number,
  options: Partial<StatTrackerInput> = {},
): StatTrackerInput {
  return {
    name,
    visualType: "bar",
    iconId,
    current,
    max,
    visibility: "public",
    canPlayerEdit: false,
    showOnToken: false,
    ...options,
  };
}

function counter(
  name: string,
  iconId: string,
  value: number,
  options: Partial<StatTrackerInput> = {},
): StatTrackerInput {
  return {
    name,
    visualType: "counter",
    iconId,
    value,
    visibility: "public",
    canPlayerEdit: false,
    showOnToken: false,
    ...options,
  };
}

function readonly(
  name: string,
  iconId: string,
  value: number,
  options: Partial<StatTrackerInput> = {},
): StatTrackerInput {
  return {
    name,
    visualType: "readonly",
    iconId,
    value,
    visibility: "public",
    canPlayerEdit: false,
    showOnToken: false,
    ...options,
  };
}

function toggle(
  name: string,
  iconId: string,
  enabled: boolean,
  options: Partial<StatTrackerInput> = {},
): StatTrackerInput {
  return {
    name,
    visualType: "toggle",
    iconId,
    enabled,
    visibility: "public",
    canPlayerEdit: false,
    showOnToken: false,
    ...options,
  };
}

function cloneTrackerInput(tracker: StatTrackerInput): StatTrackerInput {
  return { ...tracker };
}

function clonePreset(preset: StatTrackerPreset): StatTrackerPreset {
  return {
    ...preset,
    trackers: preset.trackers.map(cloneTrackerInput),
  };
}

function withTimestamp(preset: Omit<StatTrackerPreset, "createdAt" | "updatedAt">): StatTrackerPreset {
  const timestamp = now();

  return {
    ...preset,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const DEFAULT_PRESETS: StatTrackerPresetMap = {
  pc: withTimestamp({
    id: "preset-pc",
    label: "PJ",
    tokenType: "pc",
    trackers: [
      bar("PV", "heart", 10, 10, { canPlayerEdit: true }),
      counter("PVT", "temp-heart", 0, { canPlayerEdit: true }),
      toggle("Bouclier", "shield", false, { canPlayerEdit: true }),
      readonly("CA", "armor", 10),
      readonly("Bouclier CA", "shield", 0),
      readonly("Bouclier Solidité", "shield", 0),
      bar("PV bouclier", "shield", 0, 0, { canPlayerEdit: true }),
      counter("Munitions", "ammo", 0, { canPlayerEdit: true }),
      counter("PP", "platinum", 0, {
        visibility: "private",
        canPlayerEdit: true,
      }),
      counter("PO", "gold", 0, {
        visibility: "private",
        canPlayerEdit: true,
      }),
      counter("PA", "silver", 0, {
        visibility: "private",
        canPlayerEdit: true,
      }),
      counter("PC", "copper", 0, {
        visibility: "private",
        canPlayerEdit: true,
      }),
      counter("Sort", "spell", 0, {
        visibility: "private",
        canPlayerEdit: true,
      }),
      counter("Point héroïsme", "hero-point", 1, { canPlayerEdit: true }),
    ],
  }),
  enemy: withTimestamp({
    id: "preset-enemy",
    label: "Ennemi",
    tokenType: "enemy",
    trackers: [
      bar("PV", "heart", 10, 10),
      counter("PVT", "temp-heart", 0),
      readonly("CA", "armor", 10),
      counter("Sort", "spell", 0, { visibility: "gm" }),
    ],
  }),
  npc: withTimestamp({
    id: "preset-npc",
    label: "PNJ",
    tokenType: "npc",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("CA", "armor", 10),
      counter("PVT", "temp-heart", 0),
    ],
  }),
  mount: withTimestamp({
    id: "preset-mount",
    label: "Monture",
    tokenType: "mount",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("CA", "armor", 10),
      counter("PVT", "temp-heart", 0),
    ],
  }),
  object: withTimestamp({
    id: "preset-object",
    label: "Objet",
    tokenType: "object",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("Solidité", "shield", 0),
      toggle("État", "object", true),
    ],
  }),
  trap: withTimestamp({
    id: "preset-trap",
    label: "Piège",
    tokenType: "trap",
    trackers: [
      readonly("DD", "trap", 10),
      toggle("Actif", "toggle", true),
      counter("Charges", "counter", 0),
    ],
  }),
  familiar: withTimestamp({
    id: "preset-familiar",
    label: "Familier",
    tokenType: "familiar",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("CA", "armor", 10),
      counter("PVT", "temp-heart", 0),
    ],
  }),
  other: withTimestamp({
    id: "preset-other",
    label: "Autre",
    tokenType: "other",
    trackers: [
      bar("PV", "heart", 10, 10),
      counter("Compteur", "counter", 0),
    ],
  }),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVisualType(value: unknown): value is StatTrackerVisualType {
  return (
    value === "icon" ||
    value === "bar" ||
    value === "counter" ||
    value === "readonly" ||
    value === "toggle"
  );
}

function isVisibility(value: unknown): value is StatTrackerVisibility {
  return value === "gm" || value === "private" || value === "public";
}

function normalizePresetTrackerInput(value: unknown): StatTrackerInput | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.name !== "string" ||
    !isVisualType(value.visualType) ||
    typeof value.iconId !== "string"
  ) {
    return null;
  }

  return {
    name: value.name,
    visualType: value.visualType,
    iconId: value.iconId,
    current: typeof value.current === "number" ? value.current : undefined,
    max: typeof value.max === "number" ? value.max : undefined,
    value: typeof value.value === "number" ? value.value : undefined,
    enabled: typeof value.enabled === "boolean" ? value.enabled : undefined,
    visibility: isVisibility(value.visibility) ? value.visibility : "public",
    canPlayerEdit:
      typeof value.canPlayerEdit === "boolean" ? value.canPlayerEdit : false,
    showOnToken:
      typeof value.showOnToken === "boolean" ? value.showOnToken : false,
  };
}

function normalizePreset(
  tokenType: StatTokenType,
  value: unknown,
  fallback: StatTrackerPreset,
): StatTrackerPreset {
  if (!isRecord(value)) {
    return clonePreset(fallback);
  }

  const trackers = Array.isArray(value.trackers)
    ? value.trackers
        .map(normalizePresetTrackerInput)
        .filter((tracker): tracker is StatTrackerInput => Boolean(tracker))
    : fallback.trackers.map(cloneTrackerInput);

  return {
    id: typeof value.id === "string" ? value.id : fallback.id,
    label:
      typeof value.label === "string" && value.label.trim()
        ? value.label.trim()
        : fallback.label,
    tokenType,
    trackers,
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : fallback.createdAt,
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : fallback.updatedAt,
  };
}

export function createDefaultStatTrackerPresets(): StatTrackerPresetMap {
  return STAT_PRESET_TOKEN_TYPES.reduce((presets, tokenType) => {
    presets[tokenType] = clonePreset(DEFAULT_PRESETS[tokenType]);
    return presets;
  }, {} as StatTrackerPresetMap);
}

export function normalizeStatTrackerPresets(value: unknown): StatTrackerPresetMap {
  const defaults = createDefaultStatTrackerPresets();

  if (!isRecord(value)) {
    return defaults;
  }

  return STAT_PRESET_TOKEN_TYPES.reduce((presets, tokenType) => {
    presets[tokenType] = normalizePreset(
      tokenType,
      value[tokenType],
      defaults[tokenType],
    );

    return presets;
  }, {} as StatTrackerPresetMap);
}

export function getStatPresetForTokenType(
  tokenType: StatTokenType,
  presets: StatTrackerPresetMap = createDefaultStatTrackerPresets(),
): StatTrackerPreset {
  return presets[tokenType] ?? presets.other;
}

export function getStatPresetOptions(): Array<{
  value: StatTokenType;
  label: string;
}> {
  return STAT_PRESET_TOKEN_TYPES.map((tokenType) => ({
    value: tokenType,
    label: STAT_TOKEN_TYPE_LABELS[tokenType],
  }));
}

export function createTrackersFromPreset(
  tokenType: StatTokenType,
  presets: StatTrackerPresetMap = createDefaultStatTrackerPresets(),
): StatTrackerInput[] {
  return getStatPresetForTokenType(tokenType, presets).trackers.map(
    cloneTrackerInput,
  );
}

export function getMissingPresetTrackerInputs(
  tokenType: StatTokenType,
  existingTrackers: StatTracker[],
  presets: StatTrackerPresetMap = createDefaultStatTrackerPresets(),
): StatTrackerInput[] {
  const existingNames = new Set(
    existingTrackers.map((tracker) =>
      tracker.name.trim().toLocaleLowerCase(),
    ),
  );

  return createTrackersFromPreset(tokenType, presets).filter(
    (tracker) => !existingNames.has(tracker.name.trim().toLocaleLowerCase()),
  );
}

export function addTrackerToPreset(
  presets: StatTrackerPresetMap,
  tokenType: StatTokenType,
  tracker: StatTrackerInput,
): StatTrackerPresetMap {
  const preset = getStatPresetForTokenType(tokenType, presets);

  return {
    ...presets,
    [tokenType]: {
      ...preset,
      trackers: [...preset.trackers, cloneTrackerInput(tracker)],
      updatedAt: now(),
    },
  };
}

export function removeTrackerFromPreset(
  presets: StatTrackerPresetMap,
  tokenType: StatTokenType,
  trackerIndex: number,
): StatTrackerPresetMap {
  const preset = getStatPresetForTokenType(tokenType, presets);

  return {
    ...presets,
    [tokenType]: {
      ...preset,
      trackers: preset.trackers.filter((_, index) => index !== trackerIndex),
      updatedAt: now(),
    },
  };
}

export function resetPresetForTokenType(
  presets: StatTrackerPresetMap,
  tokenType: StatTokenType,
): StatTrackerPresetMap {
  return {
    ...presets,
    [tokenType]: clonePreset(DEFAULT_PRESETS[tokenType]),
  };
}

export function resetAllStatPresets(): StatTrackerPresetMap {
  return createDefaultStatTrackerPresets();
}
