import { STAT_TOKEN_TYPE_LABELS } from "./statLabels";
import type {
  StatTokenType,
  StatTracker,
  StatTrackerInput,
} from "../statTypes";

export type StatTrackerPreset = {
  id: string;
  label: string;
  tokenType: StatTokenType;
  trackers: StatTrackerInput[];
};

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

export const STAT_TRACKER_PRESETS: Record<StatTokenType, StatTrackerPreset> = {
  pc: {
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
  },
  enemy: {
    id: "preset-enemy",
    label: "Ennemi",
    tokenType: "enemy",
    trackers: [
      bar("PV", "heart", 10, 10),
      counter("PVT", "temp-heart", 0),
      readonly("CA", "armor", 10),
      counter("Sort", "spell", 0, { visibility: "gm" }),
    ],
  },
  npc: {
    id: "preset-npc",
    label: "PNJ",
    tokenType: "npc",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("CA", "armor", 10),
      counter("PVT", "temp-heart", 0),
    ],
  },
  mount: {
    id: "preset-mount",
    label: "Monture",
    tokenType: "mount",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("CA", "armor", 10),
      counter("PVT", "temp-heart", 0),
    ],
  },
  object: {
    id: "preset-object",
    label: "Objet",
    tokenType: "object",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("Solidité", "shield", 0),
      toggle("État", "object", true),
    ],
  },
  trap: {
    id: "preset-trap",
    label: "Piège",
    tokenType: "trap",
    trackers: [
      readonly("DD", "trap", 10),
      toggle("Actif", "toggle", true),
      counter("Charges", "counter", 0),
    ],
  },
  familiar: {
    id: "preset-familiar",
    label: "Familier",
    tokenType: "familiar",
    trackers: [
      bar("PV", "heart", 10, 10),
      readonly("CA", "armor", 10),
      counter("PVT", "temp-heart", 0),
    ],
  },
  other: {
    id: "preset-other",
    label: "Autre",
    tokenType: "other",
    trackers: [
      bar("PV", "heart", 10, 10),
      counter("Compteur", "counter", 0),
    ],
  },
};

export function getStatPresetForTokenType(
  tokenType: StatTokenType,
): StatTrackerPreset {
  return STAT_TRACKER_PRESETS[tokenType] ?? STAT_TRACKER_PRESETS.other;
}

export function getStatPresetOptions(): Array<{
  value: StatTokenType;
  label: string;
}> {
  return Object.keys(STAT_TRACKER_PRESETS).map((tokenType) => ({
    value: tokenType as StatTokenType,
    label: STAT_TOKEN_TYPE_LABELS[tokenType as StatTokenType],
  }));
}

export function createTrackersFromPreset(
  tokenType: StatTokenType,
): StatTrackerInput[] {
  return getStatPresetForTokenType(tokenType).trackers.map(cloneTrackerInput);
}

export function getMissingPresetTrackerInputs(
  tokenType: StatTokenType,
  existingTrackers: StatTracker[],
): StatTrackerInput[] {
  const existingNames = new Set(
    existingTrackers.map((tracker) =>
      tracker.name.trim().toLocaleLowerCase(),
    ),
  );

  return createTrackersFromPreset(tokenType).filter(
    (tracker) => !existingNames.has(tracker.name.trim().toLocaleLowerCase()),
  );
}
