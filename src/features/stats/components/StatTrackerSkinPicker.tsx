import { Check } from "lucide-react";
import { STAT_TRACKER_SKINS } from "../services/statTrackerSkins";
import type { StatTrackerSkinId } from "../statTypes";

type Props = {
  value: StatTrackerSkinId;
  onChange: (skinId: StatTrackerSkinId) => void;
};

export function StatTrackerSkinPicker({ onChange, value }: Props) {
  return (
    <div className="stat-skin-picker" role="radiogroup" aria-label="Style du tracker">
      {STAT_TRACKER_SKINS.map((skin) => {
        const active = skin.id === value;

        return (
          <button
            aria-checked={active}
            aria-label={skin.label}
            className={active ? "stat-skin-picker__item stat-skin-picker__item--active" : "stat-skin-picker__item"}
            key={skin.id}
            onClick={() => onChange(skin.id)}
            role="radio"
            title={skin.label}
            type="button"
          >
            <span
              className="stat-skin-picker__swatch"
              style={{ background: skin.accent }}
            />
            {active ? <Check aria-hidden size={13} strokeWidth={3} /> : null}
          </button>
        );
      })}
    </div>
  );
}
