import { useState } from "react";
import type { AppRoute } from "./core/types/coreTypes";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DebugPage } from "./features/debug/DebugPage";
import { ModulesPage } from "./features/modules/ModulesPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AppShell } from "./shared/components/AppShell";
import { useModulePreferences } from "./shared/hooks/useModulePreferences";
import { useObrReady } from "./shared/hooks/useObrReady";

export default function App() {
  const [route, setRoute] = useState<AppRoute>("dashboard");
  const obr = useObrReady();
  const { moduleStates, setModuleEnabled, resetLocalPreferences } = useModulePreferences();
  const page = route === "dashboard" ? <DashboardPage obr={obr} moduleStates={moduleStates} /> : route === "modules" ? <ModulesPage moduleStates={moduleStates} onToggleModule={setModuleEnabled} /> : route === "settings" ? <SettingsPage onReset={resetLocalPreferences} /> : <DebugPage obr={obr} moduleStates={moduleStates} />;
  return <AppShell route={route} onRouteChange={setRoute} obr={obr}>{page}</AppShell>;
}
