import { STORAGE_KEYS } from "../../../core/constants/ids";
import { readJson, removeItem, writeJson } from "../../../core/storage/localStorage";
import type { RangePreferences } from "../rangeTypes";
import { defaultRangePresets } from "./rangePresets";

export const defaultRangePreferences: RangePreferences = {
  measurementMode: "center-to-center",
  defaultUnit: "grid",
  selectedPresetId: defaultRangePresets[0]?.id,
  presets: defaultRangePresets,
};

export function readRangePreferences(): RangePreferences {
  const stored = readJson<Partial<RangePreferences>>(STORAGE_KEYS.RANGE_PREFERENCES, {});
  return {
    measurementMode: stored.measurementMode ?? defaultRangePreferences.measurementMode,
    defaultUnit: stored.defaultUnit ?? defaultRangePreferences.defaultUnit,
    selectedPresetId: stored.selectedPresetId ?? defaultRangePreferences.selectedPresetId,
    presets: stored.presets?.length ? stored.presets : defaultRangePresets,
  };
}

export function writeRangePreferences(preferences: RangePreferences): boolean {
  return writeJson(STORAGE_KEYS.RANGE_PREFERENCES, preferences);
}

export function resetRangePreferences(): RangePreferences {
  removeItem(STORAGE_KEYS.RANGE_PREFERENCES);
  return defaultRangePreferences;
}
