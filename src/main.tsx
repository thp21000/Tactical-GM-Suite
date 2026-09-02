import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./shared/styles/globals.css";
import "./shared/styles/scrollbars.css";
import "./features/stats/statTrackerUi.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<React.StrictMode><App /></React.StrictMode>);
