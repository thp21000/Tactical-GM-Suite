import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppPreferencesProvider } from "./core/preferences/AppPreferencesProvider";
import { setupStatBackground } from "./features/stats/background/setupStatBackground";
import { StatConditionContextAccessGate } from "./features/stats/context/StatConditionContextAccessGate";
import { StatTrackerContextMenuApp } from "./features/stats/context/StatTrackerContextMenuApp";
import { setupTokenToolsBackground } from "./features/token-tools/setupTokenToolsBackground";
import { TokenToolsPopoverApp } from "./features/token-tools/TokenToolsPopoverApp";
import { I18nProvider } from "./i18n";
import "./shared/styles/globals.css";
import "./shared/styles/scrollbars.css";
import "./features/stats/statTrackerUi.css";
import "./features/stats/context/statConditionCustomSelect.css";
import "./features/stats/context/statConditionListMeta.css";
import "./shared/styles/obrIntegratedUi.css";
import "./features/stats/statMaxValueBar.css";
import "./features/stats/statMaxValueBarLiquid.css";
import "./features/stats/statCounterBar.css";
import "./features/stats/statFixedOrb.css";
import "./features/stats/statIconUnits.css";

const view = new URLSearchParams(window.location.search).get("view");

if (view === "background") {
  setupStatBackground();
  setupTokenToolsBackground();
} else {
  const page =
    view === "stats-conditions" ? (
      <StatConditionContextAccessGate />
    ) : view === "stats-trackers" ? (
      <StatTrackerContextMenuApp />
    ) : view === "token-tools" ? (
      <TokenToolsPopoverApp />
    ) : (
      <App />
    );

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <AppPreferencesProvider>
        <I18nProvider>{page}</I18nProvider>
      </AppPreferencesProvider>
    </React.StrictMode>,
  );
}
