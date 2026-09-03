export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;
export type LanguagePreference = (typeof SUPPORTED_LANGUAGES)[number];

export const GAME_SYSTEMS = ["DND5E", "PF2E", "GENERIC"] as const;
export type GameSystemPreference = (typeof GAME_SYSTEMS)[number];

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return SUPPORTED_LANGUAGES.includes(value as LanguagePreference);
}

export function isGameSystemPreference(value: unknown): value is GameSystemPreference {
  return GAME_SYSTEMS.includes(value as GameSystemPreference);
}
