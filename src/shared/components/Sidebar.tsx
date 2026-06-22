import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Activity, ListOrdered, LayoutDashboard, Ruler, Settings } from "lucide-react";
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
  onRouteChange: (route: AppRoute) => void;
};

export function Sidebar({ route, onRouteChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHoverSuppressed, setIsHoverSuppressed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsHoverSuppressed(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!sidebarRef.current?.contains(event.relatedTarget as Node | null)) {
      setIsOpen(false);
    }
  }

  return (
    <nav
      ref={sidebarRef}
      className={clsx("sidebar", isOpen && "sidebar--open")}
      aria-label="Navigation principale"
      onMouseEnter={() => {
        if (!isHoverSuppressed) {
          setIsOpen(true);
        }
      }}
      onMouseLeave={() => {
        setIsOpen(false);
        setIsHoverSuppressed(false);
      }}
      onFocus={() => setIsOpen(true)}
      onBlur={handleBlur}
    >
      <div className="sidebar__items">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={clsx("nav-item", route === id && "nav-item--active")}
            onClick={() => {
              onRouteChange(id);
              setIsOpen(false);
              setIsHoverSuppressed(true);
            }}
            type="button"
            title={!isOpen ? label : undefined}
            aria-label={label}
          >
            <span className="nav-item__icon">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className="nav-item__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
