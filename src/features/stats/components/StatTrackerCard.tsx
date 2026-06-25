import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { STAT_TRACKER_VISUAL_TYPE_LABELS } from "../services/statLabels";
import { getTrackerEditBadgeLabel, getTrackerVisibilityBadgeLabel } from "../services/statPermissions";
import { getTrackerDisplayValue } from "../services/statTrackers";
import { getTrackerIcon } from "../services/statTrackerIcons";
import type { StatTrackedToken, StatTracker, StatTrackerInput } from "../statTypes";
import { StatTrackerForm } from "./StatTrackerForm";
import { StatTrackerValueControls } from "./StatTrackerValueControls";

type Props = {
  token: StatTrackedToken;
  tracker: StatTracker;
  onChangeValue: (delta: number) => void;
  onRemove: () => void;
  onToggle: () => void;
  onUpdate: (input: StatTrackerInput) => void;
};

function getTrackerPercent(tracker: StatTracker): number {
  if (tracker.visualType !== "bar" || !tracker.max) {
    return 0;
  }

  return Math.max(0, Math.min(100, ((tracker.current ?? 0) / tracker.max) * 100));
}

export function StatTrackerCard({
  onChangeValue,
  onRemove,
  onToggle,
  onUpdate,
  token,
  tracker,
}: Props) {
  const [editing, setEditing] = useState(false);

  const icon = getTrackerIcon(tracker.iconId);
  const percent = getTrackerPercent(tracker);
  const visualTypeLabel = STAT_TRACKER_VISUAL_TYPE_LABELS[tracker.visualType];
  const visibilityLabel = getTrackerVisibilityBadgeLabel(tracker);
  const editLabel = getTrackerEditBadgeLabel(token, tracker);

  if (editing) {
    return (
      <div className="stat-tracker-card">
        <StatTrackerForm
          tracker={tracker}
          onCancel={() => setEditing(false)}
          onSubmit={(input) => {
            onUpdate(input);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <article className={`stat-tracker-card stat-tracker-card--${tracker.visualType}`}>
      <div className="stat-tracker-card__header">
        <span className="stat-tracker-card__icon" aria-hidden>
          {icon.symbol}
        </span>

        <div>
          <h4>{tracker.name}</h4>
          <span>
            {icon.label} · {visualTypeLabel}
          </span>
        </div>

        <div className="stat-tracker-card__badges">
          <Badge>{visibilityLabel}</Badge>
          <Badge>{editLabel}</Badge>
        </div>
      </div>

      {tracker.visualType === "bar" ? (
        <div className="stat-health">
          <div className="stat-health__meta">
            <span>{getTrackerDisplayValue(tracker)}</span>
          </div>

          <div className="stat-health__track">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : (
        <strong className="stat-tracker-card__value">
          {getTrackerDisplayValue(tracker)}
        </strong>
      )}

      {tracker.visualType === "toggle" ? (
        <Button onClick={onToggle}>
          {tracker.enabled ? "Désactiver" : "Activer"}
        </Button>
      ) : null}

      <StatTrackerValueControls tracker={tracker} onChange={onChangeValue} />

      <div className="stat-tracker-card__actions">
        {tracker.showOnToken ? (
          <Badge tone="success">Affichage token prévu</Badge>
        ) : null}

        <Button onClick={() => setEditing(true)}>Modifier</Button>
        <Button onClick={onRemove}>Supprimer</Button>
      </div>
    </article>
  );
}
