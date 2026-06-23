import { STAT_TRACKER_ICONS } from "../services/statTrackerIcons";

type Props = { value: string; onChange: (iconId: string) => void };

export function StatTrackerIconPicker({ onChange, value }: Props) {
  return (
    <div className="stat-icon-picker" role="radiogroup" aria-label="Icône du tracker">
      {STAT_TRACKER_ICONS.map((icon) => (
        <button className={icon.id === value ? "stat-icon-picker__item stat-icon-picker__item--active" : "stat-icon-picker__item"} key={icon.id} onClick={() => onChange(icon.id)} title={icon.label} type="button">
          <span>{icon.symbol}</span>
          <small>{icon.label}</small>
        </button>
      ))}
    </div>
  );
}
