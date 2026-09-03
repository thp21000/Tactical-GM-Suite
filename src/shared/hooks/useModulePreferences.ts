import { useAppPreferences } from "../../core/preferences/AppPreferencesProvider";

/**
 * @deprecated Utiliser useAppPreferences pour les nouveaux développements.
 * Conservé comme alias afin de ne pas casser les imports historiques.
 */
export function useModulePreferences() {
  return useAppPreferences();
}
