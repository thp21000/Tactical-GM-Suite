import type { StatTrackerIcon, StatTrackerIconCategory } from "../statTypes";

export const STAT_TRACKER_ICONS: StatTrackerIcon[] = [
  { id: "heart", label: "PV", category: "health", symbol: "💖" },
  { id: "temp-heart", label: "PV temporaires", category: "health", symbol: "💙" },
  { id: "shield", label: "Bouclier", category: "armor", symbol: "🛡️" },
  { id: "armor", label: "Armure / CA", category: "armor", symbol: "🥋" },
  { id: "ammo", label: "Munitions", category: "combat", symbol: "🏹" },
  { id: "platinum", label: "PP", category: "money", symbol: "⚪" },
  { id: "gold", label: "PO", category: "money", symbol: "🟡" },
  { id: "silver", label: "PA", category: "money", symbol: "⚙️" },
  { id: "copper", label: "PC", category: "money", symbol: "🟤" },
  { id: "spell", label: "Sort", category: "magic", symbol: "📜" },
  { id: "hero-point", label: "Point héroïsme", category: "resource", symbol: "⭐" },
  { id: "magic", label: "Magie", category: "magic", symbol: "✨" },
  { id: "counter", label: "Compteur", category: "resource", symbol: "🔢" },
  { id: "toggle", label: "Toggle", category: "utility", symbol: "✅" },
  { id: "object", label: "Objet", category: "utility", symbol: "📦" },
  { id: "trap", label: "Piège", category: "status", symbol: "⚠️" },
  { id: "familiar", label: "Familier", category: "other", symbol: "🐾" },
  { id: "other", label: "Autre", category: "other", symbol: "◆" },
];

export function getTrackerIcon(iconId: string): StatTrackerIcon {
  return STAT_TRACKER_ICONS.find((icon) => icon.id === iconId) ?? STAT_TRACKER_ICONS[STAT_TRACKER_ICONS.length - 1];
}

export function getTrackerIconsByCategory(category: StatTrackerIconCategory): StatTrackerIcon[] {
  return STAT_TRACKER_ICONS.filter((icon) => icon.category === category);
}
