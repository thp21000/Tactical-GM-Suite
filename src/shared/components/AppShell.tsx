import type { ReactNode } from "react";
import type { ObrReadyState } from "../../core/obr/obrReady";
import type { AppRoute } from "../../core/types/coreTypes";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type AppShellProps = {
  route: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  obr: ObrReadyState;
  children: ReactNode;
};

export function AppShell({ route, onRouteChange, obr, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <TopBar obr={obr} />
      <div className="app-body">
        <Sidebar route={route} onRouteChange={onRouteChange} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
