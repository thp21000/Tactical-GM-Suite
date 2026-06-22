import type { RangeDistanceUnit, RangePreset } from "../rangeTypes";

export const defaultRangePresets: RangePreset[] = [
  { id: "contact", name: "Contact", value: 1, unit: "grid", isDefault: true },
  { id: "short", name: "Courte portée", value: 6, unit: "grid", isDefault: true },
  { id: "medium", name: "Moyenne portée", value: 12, unit: "grid", isDefault: true },
  { id: "long", name: "Longue portée", value: 24, unit: "grid", isDefault: true },
];

export function createRangePreset(name: string, value: number, unit: RangeDistanceUnit): RangePreset {
  return { id: `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: name.trim() || "Portée", value, unit, isDefault: false };
}
