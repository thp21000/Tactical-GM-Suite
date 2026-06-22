import { Bug, LayoutDashboard, Settings, SquaresFour } from "lucide-react";
import clsx from "clsx";
import type { AppRoute } from "../../core/types/coreTypes";
const items = [ { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard }, { id: "modules", label: "Modules", Icon: SquaresFour }, { id: "settings", label: "Paramètres", Icon: Settings }, { id: "debug", label: "Debug", Icon: Bug } ] as const;
export function Sidebar({ route, onRouteChange }: { route: AppRoute; onRouteChange: (route: AppRoute) => void }) { return <nav className="sidebar">{items.map(({ id, label, Icon }) => <button key={id} className={clsx("nav-item", route === id && "nav-item--active")} onClick={() => onRouteChange(id)}><Icon size={16}/><span>{label}</span></button>)}</nav>; }
