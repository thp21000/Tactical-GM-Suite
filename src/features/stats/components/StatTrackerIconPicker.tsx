import { Coins, HeartPulse, Shapes, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getTrackerIcon,
  getTrackerIconsByCategory,
} from "../services/statTrackerIcons";
import type { StatTrackerIconCategory } from "../statTypes";

type Props = { value: string; onChange: (iconId: string) => void };

const CATEGORY_TABS: Array<{
  id: StatTrackerIconCategory;
  label: string;
  Icon: typeof HeartPulse;
}> = [
  { id: "body", label: "Corps & Protection", Icon: HeartPulse },
  { id: "arcane", label: "Arcane & Combat", Icon: Sparkles },
  { id: "resource", label: "Ressources & Richesses", Icon: Coins },
  { id: "object", label: "Objets & Marques", Icon: Shapes },
];

export function StatTrackerIconPicker({ onChange, value }: Props) {
  const selectedIcon = getTrackerIcon(value);
  const [activeCategory, setActiveCategory] = useState<StatTrackerIconCategory>(
    selectedIcon.category,
  );

  useEffect(() => {
    setActiveCategory(getTrackerIcon(value).category);
  }, [value]);

  const icons = useMemo(
    () => getTrackerIconsByCategory(activeCategory),
    [activeCategory],
  );

  return (
    <div className="stat-icon-browser">
      <div className="stat-icon-tabs" role="tablist" aria-label="Catégories d’icônes">
        {CATEGORY_TABS.map(({ Icon, id, label }) => (
          <button
            aria-label={label}
            aria-selected={id === activeCategory}
            className={id === activeCategory ? "stat-icon-tab stat-icon-tab--active" : "stat-icon-tab"}
            key={id}
            onClick={() => setActiveCategory(id)}
            role="tab"
            title={label}
            type="button"
          >
            <Icon aria-hidden size={18} strokeWidth={1.9} />
          </button>
        ))}
      </div>

      <div className="stat-icon-picker" role="radiogroup" aria-label="Icône du tracker">
        {icons.map((icon) => {
          const active = icon.id === value;

          return (
            <button
              aria-checked={active}
              aria-label={icon.label}
              className={active ? "stat-icon-picker__item stat-icon-picker__item--active" : "stat-icon-picker__item"}
              key={icon.id}
              onClick={() => onChange(icon.id)}
              role="radio"
              title={icon.label}
              type="button"
            >
              {icon.src ? (
                <img alt="" draggable={false} src={icon.src} />
              ) : (
                <span aria-hidden>{icon.symbol ?? "◆"}</span>
              )}
            </button>
          );
        })}

        {icons.length === 0 ? (
          <p className="stat-icon-picker__empty">Aucune icône dans cette catégorie.</p>
        ) : null}
      </div>
    </div>
  );
}
