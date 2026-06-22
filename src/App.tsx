import { useState } from "react";
import type { AppRoute } from "./core/types/coreTypes";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DebugPage } from "./features/debug/DebugPage";
import { InitiativePage } from "./features/initiative/InitiativePage";
import { ModulesPage } from "./features/modules/ModulesPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AppShell } from "./shared/components/AppShell";
import { useModulePreferences } from "./shared/hooks/useModulePreferences";
import { useObrReady } from "./shared/hooks/useObrReady";

export default function App() {
  const [route, setRoute] = useState<AppRoute>("dashboard");
  const obr = useObrReady();
  const { moduleStates, setModuleEnabled, resetLocalPreferences } =
    useModulePreferences();

  const page = (() => {
    switch (route) {
      case "initiative":
        return <InitiativePage obr={obr} />;
      case "modules":
        return (
          <ModulesPage
            moduleStates={moduleStates}
            onToggleModule={setModuleEnabled}
          />
        );
      case "settings":
        return <SettingsPage onReset={resetLocalPreferences} />;
      case "debug":
        return <DebugPage obr={obr} moduleStates={moduleStates} />;
      case "dashboard":
      default:
        return <DashboardPage obr={obr} moduleStates={moduleStates} />;
    }
  })();

  return (
    <AppShell route={route} onRouteChange={setRoute} obr={obr}>
      {page}
    </AppShell>
  );
}
