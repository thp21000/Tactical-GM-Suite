import type { ReactNode } from "react";
import type { AppRoute } from "../../core/types/coreTypes";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  route: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  children: ReactNode;
};

export function AppShell({ route, onRouteChange, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-body">
        <Sidebar route={route} onRouteChange={onRouteChange} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
