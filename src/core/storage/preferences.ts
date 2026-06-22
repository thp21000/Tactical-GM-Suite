import { STORAGE_KEYS } from "../constants/ids";
import { createDefaultModuleStates, normalizeModuleStates, type ModuleStateMap } from "../modules/moduleState";
import { readJson, removeItem, writeJson } from "./localStorage";

export type ThemePreference = "dark";
export type LanguagePreference = "fr";
export type Preferences = { theme: ThemePreference; language: LanguagePreference; moduleStates: ModuleStateMap };

export const defaultPreferences: Preferences = { theme: "dark", language: "fr", moduleStates: createDefaultModuleStates() };

export function readPreferences(): Preferences {
  const stored = readJson<Partial<Preferences>>(STORAGE_KEYS.PREFERENCES, {});
  return { theme: "dark", language: "fr", moduleStates: normalizeModuleStates(stored.moduleStates) };
}

export function savePreferences(preferences: Preferences): boolean {
  return writeJson(STORAGE_KEYS.PREFERENCES, { ...preferences, moduleStates: normalizeModuleStates(preferences.moduleStates) });
}

export function resetPreferences(): Preferences {
  removeItem(STORAGE_KEYS.PREFERENCES);
  removeItem(STORAGE_KEYS.MODULE_STATES);
  return defaultPreferences;
}
