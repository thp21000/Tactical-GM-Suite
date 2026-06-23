import type {
  StatTokenType,
  StatTrackerVisibility,
  StatTrackerVisualType,
} from "../statTypes";

export const STAT_TOKEN_TYPE_LABELS: Record<StatTokenType, string> = {
  pc: "PJ",
  npc: "PNJ",
  enemy: "Ennemi",
  mount: "Monture",
  object: "Objet",
  trap: "Piège",
  familiar: "Familier",
  other: "Autre",
};

export const STAT_TRACKER_VISUAL_TYPE_LABELS: Record<StatTrackerVisualType, string> = {
  icon: "Icône seule",
  bar: "Barre à valeur max",
  counter: "Indicateur modifiable",
  readonly: "Indicateur fixe",
  toggle: "Toggle / case",
};

export const STAT_TRACKER_VISIBILITY_LABELS: Record<StatTrackerVisibility, string> = {
  gm: "MJ",
  private: "Privé",
  public: "Public",
};

export const STAT_TOKEN_TYPE_OPTIONS = Object.entries(STAT_TOKEN_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as StatTokenType, label }),
);

export const STAT_TRACKER_VISUAL_TYPE_OPTIONS = Object.entries(
  STAT_TRACKER_VISUAL_TYPE_LABELS,
).map(([value, label]) => ({ value: value as StatTrackerVisualType, label }));

export const STAT_TRACKER_VISIBILITY_OPTIONS = Object.entries(
  STAT_TRACKER_VISIBILITY_LABELS,
).map(([value, label]) => ({ value: value as StatTrackerVisibility, label }));
