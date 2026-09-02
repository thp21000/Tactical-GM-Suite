import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { STAT_TRACKER_VISUAL_TYPE_LABELS } from "../services/statLabels";
import { getTrackerEditBadgeLabel, getTrackerVisibilityBadgeLabel } from "../services/statPermissions";
import { getTrackerDisplayValue } from "../services/statTrackers";
import { getTrackerIcon, getTrackerIconAccent } from "../services/statTrackerIcons";
import type { StatTrackedToken, StatTracker, StatTrackerInput } from "../statTypes";
import { StatTrackerForm } from "./StatTrackerForm";
import { StatTrackerValueControls } from "./StatTrackerValueControls";

type Props = {
  canEdit: boolean;
  isGm: boolean;
  token: StatTrackedToken;
  tracker: StatTracker;
  onChangeValue: (delta: number) => void;
  onRemove: () => void;
  onToggle: () => void;
  onUpdate: (input: StatTrackerInput) => void;
};

type BarTrackerProps = {
  canEdit: boolean;
  isGm: boolean;
  tracker: StatTracker;
  onEdit: () => void;
  onRemove: () => void;
  onUpdate: (input: StatTrackerInput) => void;
};

function getTrackerPercent(tracker: StatTracker): number {
  if (tracker.visualType !== "bar" || !tracker.max) {
    return 0;
  }

  return Math.max(0, Math.min(100, ((tracker.current ?? 0) / tracker.max) * 100));
}

function trackerToInput(
  tracker: StatTracker,
  overrides: Partial<StatTrackerInput> = {},
): StatTrackerInput {
  return {
    name: tracker.name,
    visualType: tracker.visualType,
    iconId: tracker.iconId,
    current: tracker.current,
    max: tracker.max,
    value: tracker.value,
    enabled: tracker.enabled,
    visibility: tracker.visibility,
    canPlayerEdit: tracker.canPlayerEdit,
    showOnToken: tracker.showOnToken,
    ...overrides,
  };
}

function StatMaxValueBar({
  canEdit,
  isGm,
  tracker,
  onEdit,
  onRemove,
  onUpdate,
}: BarTrackerProps) {
  const [editingValue, setEditingValue] = useState(false);
  const [draftValue, setDraftValue] = useState(String(tracker.current ?? 0));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const icon = getTrackerIcon(tracker.iconId);
  const accent = getTrackerIconAccent(tracker.iconId);
  const percent = getTrackerPercent(tracker);
  const current = tracker.current ?? 0;
  const max = tracker.max ?? 0;

  useEffect(() => {
    if (!editingValue) {
      setDraftValue(String(current));
    }
  }, [current, editingValue]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeFromOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [menuOpen]);

  const cancelValueEdit = () => {
    setDraftValue(String(current));
    setEditingValue(false);
  };

  const commitValue = () => {
    const parsed = Number(draftValue.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      cancelValueEdit();
      return;
    }

    const upperBound = Math.max(0, max);
    const nextCurrent = Math.max(0, Math.min(upperBound, parsed));
    if (nextCurrent !== current) {
      onUpdate(trackerToInput(tracker, { current: nextCurrent }));
    }
    setDraftValue(String(nextCurrent));
    setEditingValue(false);
  };

  const style = {
    "--stat-bar-accent": accent,
    "--stat-bar-fill": `${percent}%`,
  } as CSSProperties;

  return (
    <div className="stat-max-bar" style={style}>
      <div className="stat-max-bar__assembly">
        <div className="stat-max-bar__rail" aria-hidden="true">
          <span className="stat-max-bar__fill" />
          <span className="stat-max-bar__shine" />
        </div>

        <span className="stat-max-bar__ornament" aria-hidden="true" />

        <span className="stat-max-bar__icon" aria-hidden="true">
          {icon.src ? (
            <img alt="" draggable={false} src={icon.src} />
          ) : (
            icon.symbol ?? "◆"
          )}
        </span>

        <div className="stat-max-bar__value-slot">
          {editingValue ? (
            <input
              aria-label={`Valeur actuelle de ${tracker.name}`}
              autoFocus
              className="stat-max-bar__value-input"
              inputMode="decimal"
              max={max}
              min={0}
              type="number"
              value={draftValue}
              onBlur={commitValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitValue();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  cancelValueEdit();
                }
              }}
            />
          ) : (
            <button
              className="stat-max-bar__value-button"
              disabled={!canEdit}
              title={canEdit ? "Cliquer pour modifier la valeur" : "Lecture seule"}
              type="button"
              onClick={() => {
                if (canEdit) setEditingValue(true);
              }}
            >
              {current}
            </button>
          )}
        </div>

        <span className="stat-max-bar__max">max {max}</span>
      </div>

      <div className="stat-max-bar__footer">
        <span className="stat-max-bar__name" title={tracker.name}>
          {tracker.name}
        </span>

        {isGm ? (
          <div className="stat-max-bar__menu" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`Actions pour ${tracker.name}`}
              className="stat-max-bar__menu-trigger"
              title="Actions"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
            >
              ⋯
            </button>

            {menuOpen ? (
              <div className="stat-max-bar__menu-panel" role="menu">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onUpdate(
                      trackerToInput(tracker, {
                        showOnToken: !tracker.showOnToken,
                      }),
                    );
                    setMenuOpen(false);
                  }}
                >
                  {tracker.showOnToken ? "Masquer du token" : "Afficher sur le token"}
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                >
                  Modifier
                </button>
                <button
                  className="is-danger"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove();
                  }}
                >
                  Supprimer
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StatTrackerCard({
  onChangeValue,
  onRemove,
  onToggle,
  onUpdate,
  canEdit,
  isGm,
  token,
  tracker,
}: Props) {
  const [editing, setEditing] = useState(false);

  const icon = getTrackerIcon(tracker.iconId);
  const visualTypeLabel = STAT_TRACKER_VISUAL_TYPE_LABELS[tracker.visualType];
  const visibilityLabel = getTrackerVisibilityBadgeLabel(tracker);
  const editLabel = getTrackerEditBadgeLabel(token, tracker);
  const isBar = tracker.visualType === "bar";

  return (
    <article
      className={`stat-tracker-card stat-tracker-card--${tracker.visualType}${
        isBar ? " stat-tracker-card--bar-compact" : ""
      }`}
    >
      {editing ? (
        <StatTrackerForm
          tracker={tracker}
          onCancel={() => setEditing(false)}
          onSubmit={(input) => {
            onUpdate(input);
            setEditing(false);
          }}
        />
      ) : null}

      {isBar ? (
        <StatMaxValueBar
          canEdit={canEdit}
          isGm={isGm}
          tracker={tracker}
          onEdit={() => setEditing(true)}
          onRemove={onRemove}
          onUpdate={onUpdate}
        />
      ) : (
        <>
          <div className="stat-tracker-card__header">
            <span className="stat-tracker-card__icon" aria-hidden>
              {icon.src ? (
                <img alt="" draggable={false} src={icon.src} />
              ) : (
                icon.symbol ?? "◆"
              )}
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

          <strong className="stat-tracker-card__value">
            {getTrackerDisplayValue(tracker)}
          </strong>

          {tracker.visualType === "toggle" && canEdit ? (
            <Button onClick={onToggle}>
              {tracker.enabled ? "Désactiver" : "Activer"}
            </Button>
          ) : null}

          <StatTrackerValueControls
            canEdit={canEdit}
            tracker={tracker}
            onChange={onChangeValue}
          />

          <div className="stat-tracker-card__actions">
            <Badge tone={tracker.showOnToken ? "success" : "default"}>
              Token {tracker.showOnToken ? "ON" : "OFF"}
            </Badge>

            {isGm ? <Button onClick={() => setEditing(true)}>Modifier</Button> : null}
            {isGm ? <Button onClick={onRemove}>Supprimer</Button> : null}
          </div>
        </>
      )}
    </article>
  );
}
