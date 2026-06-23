import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import type { StatTracker, StatTrackerInput } from "../statTypes";
import { getTrackerDisplayValue } from "../services/statTrackers";
import { getTrackerIcon } from "../services/statTrackerIcons";
import { StatTrackerForm } from "./StatTrackerForm";
import { StatTrackerValueControls } from "./StatTrackerValueControls";

type Props = {
  tracker: StatTracker;
  onChangeValue: (delta: number) => void;
  onRemove: () => void;
  onToggle: () => void;
  onUpdate: (input: StatTrackerInput) => void;
};

export function StatTrackerCard({ onChangeValue, onRemove, onToggle, onUpdate, tracker }: Props) {
  const [editing, setEditing] = useState(false);
  const icon = getTrackerIcon(tracker.iconId);
  const percent = tracker.visualType === "bar" && tracker.max ? Math.max(0, Math.min(100, ((tracker.current ?? 0) / tracker.max) * 100)) : 0;

  if (editing) {
    return <div className="stat-tracker-card"><StatTrackerForm tracker={tracker} onCancel={() => setEditing(false)} onSubmit={(input) => { onUpdate(input); setEditing(false); }} /></div>;
  }

  return (
    <article className={`stat-tracker-card stat-tracker-card--${tracker.visualType}`}>
      <div className="stat-tracker-card__header">
        <span className="stat-tracker-card__icon" aria-hidden>{icon.symbol}</span>
        <div>
          <h4>{tracker.name}</h4>
          <span>{icon.label} · {tracker.visualType}</span>
        </div>
        <Badge>{tracker.visibility}</Badge>
      </div>

      {tracker.visualType === "bar" ? (
        <div className="stat-health">
          <div className="stat-health__meta"><span>{getTrackerDisplayValue(tracker)}</span></div>
          <div className="stat-health__track"><span style={{ width: `${percent}%` }} /></div>
        </div>
      ) : <strong className="stat-tracker-card__value">{getTrackerDisplayValue(tracker)}</strong>}

      {tracker.visualType === "toggle" ? <Button onClick={onToggle}>{tracker.enabled ? "Désactiver" : "Activer"}</Button> : null}
      <StatTrackerValueControls tracker={tracker} onChange={onChangeValue} />
      <div className="stat-tracker-card__actions">
        {tracker.showOnToken ? <Badge tone="success">prévu token</Badge> : null}
        <Button onClick={() => setEditing(true)}>Modifier</Button>
        <Button onClick={onRemove}>Supprimer</Button>
      </div>
    </article>
  );
}
