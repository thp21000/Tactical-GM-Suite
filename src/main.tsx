import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setupStatBackground } from "./features/stats/background/setupStatBackground";
import { StatConditionContextMenuApp } from "./features/stats/context/StatConditionContextMenuApp";
import "./shared/styles/globals.css";
import "./shared/styles/scrollbars.css";
import "./features/stats/statTrackerUi.css";
import "./features/stats/context/statConditionCustomSelect.css";
import "./features/stats/context/statConditionListMeta.css";
import "./shared/styles/obrIntegratedUi.css";

const view = new URLSearchParams(window.location.search).get("view");

if (view === "background") {
  setupStatBackground();
} else {
  const page = view === "stats-conditions" ? <StatConditionContextMenuApp /> : <App />;

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>{page}</React.StrictMode>,
  );
}
