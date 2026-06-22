import { useEffect, useRef } from "react";
import { Activity, ListOrdered, LayoutDashboard, Menu, Ruler, Settings } from "lucide-react";
import clsx from "clsx";
import type { AppRoute } from "../../core/types/coreTypes";

const items = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "initiative", label: "Initiative", Icon: ListOrdered },
  { id: "range", label: "Distances", Icon: Ruler },
  { id: "stats", label: "Stats", Icon: Activity },
  { id: "settings", label: "Paramètres", Icon: Settings },
] as const;

type SidebarProps = {
  route: AppRoute;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRouteChange: (route: AppRoute) => void;
};

export function Sidebar({ route, isOpen, onToggle, onClose, onRouteChange }: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!sidebarRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <nav ref={sidebarRef} className={clsx("sidebar", isOpen && "sidebar--open")} aria-label="Navigation principale">
      <button className="sidebar__toggle" type="button" onClick={onToggle} aria-expanded={isOpen} aria-label="Ouvrir ou fermer la navigation">
        <Menu size={18} aria-hidden="true" />
        <span className="sidebar__toggle-label">Menu</span>
      </button>

      <div className="sidebar__items">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={clsx("nav-item", route === id && "nav-item--active")}
            onClick={() => {
              onRouteChange(id);
              onClose();
            }}
            type="button"
            title={!isOpen ? label : undefined}
            aria-label={label}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="nav-item__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
