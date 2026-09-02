import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

type CounterTrackerProps = {
  canEdit: boolean;
  isGm: boolean;
  tracker: StatTracker;
  onChangeValue: (delta: number) => void;
  onEdit: () => void;
  onRemove: () => void;
  onUpdate: (input: StatTrackerInput) => void;
};

type BubbleSpec = {
  x: number;
  y: number;
  size: number;
  opacity: number;
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

function createSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBubbleSpecs(seedKey: string, count: number): BubbleSpec[] {
  const random = createSeededRandom(createSeed(seedKey));

  return Array.from({ length: count }, () => ({
    x: 4 + random() * 92,
    y: 14 + random() * 72,
    size: 1.3 + random() * 3.2,
    opacity: 0.18 + random() * 0.42,
  }));
}

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
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const icon = getTrackerIcon(tracker.iconId);
  const accent = getTrackerIconAccent(tracker.iconId);
  const current = tracker.current ?? 0;
  const max = tracker.max ?? 0;
  const displayedCurrent = dragValue ?? current;
  const percent =
    max > 0
      ? Math.max(0, Math.min(100, (displayedCurrent / max) * 100))
      : getTrackerPercent(tracker);
  const fillRatio = percent / 100;
  const bubbleSpecs = useMemo(
    () => buildBubbleSpecs(`${tracker.id}:${tracker.iconId}`, 56),
    [tracker.id, tracker.iconId],
  );
  const visibleBubbleCount = Math.min(
    bubbleSpecs.length,
    Math.round(bubbleSpecs.length * Math.pow(fillRatio, 1.35)),
  );
  const visibleBubbles = bubbleSpecs.slice(0, visibleBubbleCount);

  useEffect(() => {
    if (!editingValue && !dragging) {
      setDraftValue(String(current));
    }
  }, [current, editingValue, dragging]);

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
    const parsed = parseInlineMath(draftValue, current);
    if (parsed === null || !Number.isFinite(parsed)) {
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

  const getValueFromPointer = (clientX: number): number => {
    const rail = railRef.current;
    if (!rail || max <= 0) return current;

    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0) return current;

    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * max);
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canEdit || editingValue || max <= 0) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setDragValue(getValueFromPointer(event.clientX));
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !canEdit) return;

    event.preventDefault();
    setDragValue(getValueFromPointer(event.clientX));
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    event.preventDefault();
    const nextCurrent = getValueFromPointer(event.clientX);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragging(false);
    setDragValue(null);

    if (nextCurrent !== current) {
      onUpdate(trackerToInput(tracker, { current: nextCurrent }));
    }
  };

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragging(false);
    setDragValue(null);
  };

  const handleRailKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!canEdit || editingValue || max <= 0) return;

    let nextCurrent: number | null = null;

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextCurrent = Math.max(0, current - 1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextCurrent = Math.min(max, current + 1);
    } else if (event.key === "Home") {
      nextCurrent = 0;
    } else if (event.key === "End") {
      nextCurrent = max;
    }

    if (nextCurrent === null) return;

    event.preventDefault();
    if (nextCurrent !== current) {
      onUpdate(trackerToInput(tracker, { current: nextCurrent }));
    }
  };

  const style = {
    "--stat-bar-accent": accent,
    "--stat-bar-fill": `${percent}%`,
    "--stat-bar-fill-ratio": fillRatio,
    "--stat-bar-icon-grayscale": `${100 - percent}%`,
  } as CSSProperties;

  const fillClassName = `stat-max-bar__fill${
    percent >= 99.999 ? " is-full" : ""
  }${percent <= 0 ? " is-empty" : ""}`;

  return (
    <div className={`stat-max-bar${dragging ? " is-dragging" : ""}`} style={style}>
      <div className="stat-max-bar__header">
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

      <div className="stat-max-bar__assembly">
        <div
          ref={railRef}
          aria-label={`${tracker.name} : ${displayedCurrent} sur ${max}`}
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={displayedCurrent}
          className="stat-max-bar__rail"
          role="slider"
          tabIndex={canEdit ? 0 : -1}
          title={canEdit ? "Cliquer ou faire glisser pour modifier la valeur" : "Lecture seule"}
          onKeyDown={handleRailKeyDown}
          onPointerCancel={cancelDrag}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
        >
          <span className={fillClassName}>
            <span className="stat-max-bar__bubble-layer" aria-hidden="true">
              {visibleBubbles.map((bubble, index) => (
                <span
                  className="stat-max-bar__bubble"
                  key={`${index}-${bubble.x.toFixed(3)}`}
                  style={
                    {
                      left: `${bubble.x}%`,
                      top: `${bubble.y}%`,
                      width: `${bubble.size}px`,
                      height: `${bubble.size}px`,
                      opacity: bubble.opacity,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          </span>
          <span className="stat-max-bar__shine" aria-hidden="true" />
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
              placeholder="+3, -2, ×2, ÷2"
              title="Valeur directe ou calcul : +3, -2, *2, /2"
              type="text"
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
              title={
                canEdit
                  ? "Cliquer pour saisir une valeur ou un calcul (+3, -2, *2, /2)"
                  : "Lecture seule"
              }
              type="button"
              onClick={() => {
                if (canEdit) setEditingValue(true);
              }}
            >
              {displayedCurrent}
            </button>
          )}
        </div>

        <span className="stat-max-bar__max">max {max}</span>
      </div>
    </div>
  );
}

function StatCounterValueTracker({
  canEdit,
  isGm,
  tracker,
  onChangeValue,
  onEdit,
  onRemove,
  onUpdate,
}: CounterTrackerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="stat-counter-card">
      <div className="stat-counter-card__header">
        <span className="stat-counter-card__name" title={tracker.name}>
          {tracker.name}
        </span>

        {isGm ? (
          <div className="stat-max-bar__menu stat-counter-card__menu" ref={menuRef}>
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

      <StatTrackerValueControls
        canEdit={canEdit}
        tracker={tracker}
        onChange={onChangeValue}
      />
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
  const isCounter = tracker.visualType === "counter";
  const isReadonly = tracker.visualType === "readonly";

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
      ) : isCounter || isReadonly ? (
        <StatCounterValueTracker
          canEdit={canEdit}
          isGm={isGm}
          tracker={tracker}
          onChangeValue={onChangeValue}
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
