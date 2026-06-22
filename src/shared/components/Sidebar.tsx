import { Bug, LayoutDashboard, LayoutGrid, Settings } from "lucide-react";
import clsx from "clsx";
import type { AppRoute } from "../../core/types/coreTypes";

const items = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "modules", label: "Modules", Icon: LayoutGrid },
  { id: "settings", label: "Paramètres", Icon: Settings },
  { id: "debug", label: "Debug", Icon: Bug },
] as const;

type SidebarProps = {
  route: AppRoute;
  onRouteChange: (route: AppRoute) => void;
};

export function Sidebar({ route, onRouteChange }: SidebarProps) {
  return (
    <nav className="sidebar">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={clsx("nav-item", route === id && "nav-item--active")}
          onClick={() => onRouteChange(id)}
          type="button"
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
