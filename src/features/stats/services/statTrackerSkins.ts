import type { StatTrackerSkinId } from "../statTypes";

export type StatTrackerSkinDefinition = {
  id: StatTrackerSkinId;
  label: string;
  accent: string;
};

export const STAT_TRACKER_SKINS: StatTrackerSkinDefinition[] = [
  { id: "neutral", label: "Neutre", accent: "#b8becc" },
  { id: "red", label: "Rouge", accent: "#e54b4b" },
  { id: "blue", label: "Bleu", accent: "#4a90e2" },
  { id: "purple", label: "Violet", accent: "#a678ff" },
  { id: "gold", label: "Or", accent: "#e7b84b" },
  { id: "green", label: "Vert", accent: "#57c878" },
  { id: "orange", label: "Orange", accent: "#e9873e" },
  { id: "steel", label: "Acier", accent: "#9ca8b8" },
  { id: "dark", label: "Sombre", accent: "#7a6a9e" },
];

export function getStatTrackerSkin(skinId?: StatTrackerSkinId): StatTrackerSkinDefinition {
  return (
    STAT_TRACKER_SKINS.find((skin) => skin.id === skinId) ??
    STAT_TRACKER_SKINS[0]
  );
}
