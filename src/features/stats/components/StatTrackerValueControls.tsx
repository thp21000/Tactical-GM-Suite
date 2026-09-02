import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "../../../shared/components/Button";
import { getTrackerIcon, getTrackerIconAccent } from "../services/statTrackerIcons";
import type { StatTracker } from "../statTypes";
import { canQuickModifyTracker } from "../services/statTrackers";

type Props = { canEdit: boolean; tracker: StatTracker; onChange: (delta: number) => void };

function parseInlineMath(input: string, baseValue: number): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!normalized) return null;

  const operation = normalized.match(
    /^([+\-*/×÷xX])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/,
  );

  if (operation) {
    const operator = operation[1];
    const operand = Number(operation[2]);
    if (!Number.isFinite(operand)) return null;

    if (operator === "+") return baseValue + operand;
    if (operator === "-") return baseValue - operand;
    if (operator === "*" || operator === "×" || operator === "x" || operator === "X") {
      return baseValue * operand;
    }
    if (operator === "/" || operator === "÷") {
      return operand === 0 ? null : baseValue / operand;
    }
  }

  const absoluteValue = Number(normalized);
  return Number.isFinite(absoluteValue) ? absoluteValue : null;
}

function StatCounterBar({ canEdit, onChange, tracker }: Props) {
  const value = tracker.value ?? tracker.current ?? 0;
  const icon = getTrackerIcon(tracker.iconId);
  const accent = getTrackerIconAccent(tracker.iconId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [editing, value]);

  const cancelEdit = () => {
    setDraft(String(value));
    setEditing(false);
  };

  const commitEdit = () => {
    const nextValue = parseInlineMath(draft, value);
    if (nextValue === null || !Number.isFinite(nextValue)) {
      cancelEdit();
      return;
    }

    const delta = nextValue - value;
    if (delta !== 0) onChange(delta);
    setDraft(String(nextValue));
    setEditing(false);
  };

  const style = {
    "--stat-counter-accent": accent,
  } as CSSProperties;

  return (
    <div className="stat-counter-bar" style={style} aria-label={`Contrôles ${tracker.name}`}>
      <div className="stat-counter-bar__rail">
        <button
          className="stat-counter-bar__step stat-counter-bar__step--minus-five"
          disabled={!canEdit}
          title="Retirer 5"
          type="button"
          onClick={() => onChange(-5)}
        >
          -5
        </button>
        <button
          className="stat-counter-bar__step stat-counter-bar__step--minus-one"
          disabled={!canEdit}
          title="Retirer 1"
          type="button"
          onClick={() => onChange(-1)}
        >
          −
        </button>
        <button
          className="stat-counter-bar__step stat-counter-bar__step--plus-one"
          disabled={!canEdit}
          title="Ajouter 1"
          type="button"
          onClick={() => onChange(1)}
        >
          +
        </button>
        <button
          className="stat-counter-bar__step stat-counter-bar__step--plus-five"
          disabled={!canEdit}
          title="Ajouter 5"
          type="button"
          onClick={() => onChange(5)}
        >
          +5
        </button>

        <div className={`stat-counter-bar__orb${editing ? " is-editing" : ""}`}>
          <span className="stat-counter-bar__orb-glass" aria-hidden="true" />
          <span className="stat-counter-bar__icon" aria-hidden="true">
            {icon.src ? <img alt="" draggable={false} src={icon.src} /> : icon.symbol ?? "◆"}
          </span>

          <span className="stat-counter-bar__value-slot">
            {editing ? (
              <input
                aria-label={`Valeur actuelle de ${tracker.name}`}
                autoFocus
                className="stat-counter-bar__value-input"
                inputMode="decimal"
                placeholder="+3"
                title="Valeur directe ou calcul : +3, -2, *2, /2"
                type="text"
                value={draft}
                onBlur={commitEdit}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitEdit();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEdit();
                  }
                }}
              />
            ) : (
              <button
                className="stat-counter-bar__value-button"
                disabled={!canEdit}
                title={
                  canEdit
                    ? "Cliquer pour saisir une valeur ou un calcul (+3, -2, *2, /2)"
                    : "Lecture seule"
                }
                type="button"
                onClick={() => {
                  if (canEdit) setEditing(true);
                }}
              >
                {value}
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatTrackerValueControls({ canEdit, onChange, tracker }: Props) {
  if (tracker.visualType === "counter") {
    return <StatCounterBar canEdit={canEdit} onChange={onChange} tracker={tracker} />;
  }

  if (!canEdit || !canQuickModifyTracker(tracker)) return null;
  return (
    <div className="stat-tracker-controls" aria-label={`Contrôles ${tracker.name}`}>
      <Button onClick={() => onChange(-5)}>-5</Button>
      <Button onClick={() => onChange(-1)}>-1</Button>
      <Button onClick={() => onChange(1)}>+1</Button>
      <Button onClick={() => onChange(5)}>+5</Button>
    </div>
  );
}
