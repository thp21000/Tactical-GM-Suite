import { useMemo, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import {
  STAT_TOKEN_TYPE_OPTIONS,
  STAT_TRACKER_VISIBILITY_LABELS,
  STAT_TRACKER_VISUAL_TYPE_LABELS,
} from "../services/statLabels";
import { getTrackerIcon } from "../services/statTrackerIcons";
import type {
  StatTokenType,
  StatTrackerInput,
  StatTrackerPresetMap,
} from "../statTypes";
import { StatTrackerForm } from "./StatTrackerForm";

type Props = {
  presets: StatTrackerPresetMap;
  onAddTracker: (tokenType: StatTokenType, input: StatTrackerInput) => void;
  onRemoveTracker: (tokenType: StatTokenType, trackerIndex: number) => void;
  onResetPreset: (tokenType: StatTokenType) => void;
  onResetPresets: () => void;
};

export function StatPresetManager({
  onAddTracker,
  onRemoveTracker,
  onResetPreset,
  onResetPresets,
  presets,
}: Props) {
  const [selectedType, setSelectedType] = useState<StatTokenType>("pc");
  const [isAddingTracker, setIsAddingTracker] = useState(false);

  const preset = presets[selectedType];

  const trackerCountLabel = useMemo(() => {
    const count = preset.trackers.length;

    return `${count} ${count > 1 ? "trackers" : "tracker"}`;
  }, [preset.trackers.length]);

  return (
    <div className="stack stat-preset-manager">
      <div className="stat-header">
        <div>
          <p className="eyebrow">Presets MJ</p>
          <h2>Presets internes</h2>
          <p>
            Modifiez les trackers ajoutés par défaut selon le type de token.
            Ces presets seront utilisés pour les prochains tokens ajoutés.
          </p>
        </div>

        <Button onClick={onResetPresets}>Réinitialiser tous les presets</Button>
      </div>

      <label>
        Type de token
        <select
          value={selectedType}
          onChange={(event) =>
            setSelectedType(event.target.value as StatTokenType)
          }
        >
          {STAT_TOKEN_TYPE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="stat-token-block">
        <div className="stat-token-block__header">
          <div>
            <h3>{preset.label}</h3>
            <span>{trackerCountLabel}</span>
          </div>

          <div className="stat-token-block__badges">
            <Badge>Preset</Badge>
          </div>
        </div>

        <div className="stat-card__actions">
          <Button onClick={() => setIsAddingTracker((current) => !current)}>
            Ajouter tracker au preset
          </Button>

          <Button onClick={() => onResetPreset(selectedType)}>
            Réinitialiser ce preset
          </Button>
        </div>

        {isAddingTracker ? (
          <StatTrackerForm
            onCancel={() => setIsAddingTracker(false)}
            onSubmit={(input) => {
              onAddTracker(selectedType, input);
              setIsAddingTracker(false);
            }}
          />
        ) : null}

        {preset.trackers.length === 0 ? (
          <p className="muted">Ce preset ne contient aucun tracker.</p>
        ) : (
          <div className="stat-tracker-list">
            {preset.trackers.map((tracker, index) => {
              const icon = getTrackerIcon(tracker.iconId);
              const visualTypeLabel =
                STAT_TRACKER_VISUAL_TYPE_LABELS[tracker.visualType];
              const visibilityLabel = STAT_TRACKER_VISIBILITY_LABELS[
                tracker.visibility ?? "public"
              ];

              return (
                <article
                  className={`stat-tracker-card stat-tracker-card--${tracker.visualType}`}
                  key={`${tracker.name}-${index}`}
                >
                  <div className="stat-tracker-card__header">
                    <span className="stat-tracker-card__icon" aria-hidden>
                      {icon.symbol}
                    </span>

                    <div>
                      <h4>{tracker.name}</h4>
                      <span>
                        {visualTypeLabel} · {visibilityLabel}
                      </span>
                    </div>

                    <Button onClick={() => onRemoveTracker(selectedType, index)}>
                      Retirer
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
