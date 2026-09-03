import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "../constants/ids";
import type {
  GameSystemPreference,
  LanguagePreference,
} from "../config/appOptions";
import {
  normalizeModuleStates,
  type ModuleStateMap,
} from "../modules/moduleState";
import {
  readPreferences,
  resetPreferences,
  savePreferences,
  type Preferences,
} from "../storage/preferences";

type AppPreferencesContextValue = {
  preferences: Preferences;
  language: LanguagePreference;
  gameSystem: GameSystemPreference;
  moduleStates: ModuleStateMap;
  setLanguage: (language: LanguagePreference) => void;
  setGameSystem: (gameSystem: GameSystemPreference) => void;
  setModuleEnabled: (moduleId: string, enabled: boolean) => void;
  resetLocalPreferences: () => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => readPreferences());

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.PREFERENCES) {
        setPreferences(readPreferences());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setLanguage = useCallback((language: LanguagePreference) => {
    setPreferences((current) => ({ ...current, language }));
  }, []);

  const setGameSystem = useCallback((gameSystem: GameSystemPreference) => {
    setPreferences((current) => ({ ...current, gameSystem }));
  }, []);

  const setModuleEnabled = useCallback((moduleId: string, enabled: boolean) => {
    setPreferences((current) => ({
      ...current,
      moduleStates: normalizeModuleStates({
        ...current.moduleStates,
        [moduleId]: enabled,
      }),
    }));
  }, []);

  const resetLocalPreferences = useCallback(() => {
    setPreferences(resetPreferences());
  }, []);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      preferences,
      language: preferences.language,
      gameSystem: preferences.gameSystem,
      moduleStates: preferences.moduleStates,
      setLanguage,
      setGameSystem,
      setModuleEnabled,
      resetLocalPreferences,
    }),
    [
      preferences,
      resetLocalPreferences,
      setGameSystem,
      setLanguage,
      setModuleEnabled,
    ],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferencesContextValue {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider.");
  }
  return context;
}
