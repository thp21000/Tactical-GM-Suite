import { useCallback, useEffect, useState } from "react";
import { normalizeModuleStates, type ModuleStateMap } from "../../core/modules/moduleState";
import { readPreferences, resetPreferences, savePreferences, type Preferences } from "../../core/storage/preferences";

export function useModulePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => readPreferences());
  useEffect(() => { savePreferences(preferences); }, [preferences]);
  const setModuleEnabled = useCallback((moduleId: string, enabled: boolean) => { setPreferences((current) => ({ ...current, moduleStates: normalizeModuleStates({ ...current.moduleStates, [moduleId]: enabled }) })); }, []);
  const resetLocalPreferences = useCallback(() => { const next = resetPreferences(); setPreferences(next); }, []);
  return { preferences, moduleStates: preferences.moduleStates as ModuleStateMap, setModuleEnabled, resetLocalPreferences };
}
