import { ChevronDown, X } from "lucide-react";
import { FormEvent, useEffect, useId, useState } from "react";
import { Button } from "../../../shared/components/Button";
import { Toggle } from "../../../shared/components/Toggle";
import {
  STAT_TRACKER_VISIBILITY_OPTIONS,
  STAT_TRACKER_VISUAL_TYPE_OPTIONS,
} from "../services/statLabels";
import {
  getDefaultTrackerIconId,
  normalizeTrackerIconId,
} from "../services/statTrackerIcons";
import type {
  StatTracker,
  StatTrackerInput,
  StatTrackerVisibility,
  StatTrackerVisualType,
} from "../statTypes";
import { StatTrackerIconPicker } from "./StatTrackerIconPicker";

type Props = {
  tracker?: StatTracker;
  onCancel: () => void;
  onSubmit: (input: StatTrackerInput) => void;
};

function toNumber(value: string): number {
  return Number(value) || 0;
}

export function StatTrackerForm({ onCancel, onSubmit, tracker }: Props) {
  const titleId = useId();
  const [name, setName] = useState(tracker?.name ?? "");
  const [visualType, setVisualType] = useState<StatTrackerVisualType>(
    tracker?.visualType ?? "counter",
  );
  const [iconId, setIconId] = useState(
    normalizeTrackerIconId(tracker?.iconId ?? getDefaultTrackerIconId()),
  );
  const [current, setCurrent] = useState(String(tracker?.current ?? 0));
  const [max, setMax] = useState(String(tracker?.max ?? 1));
  const [value, setValue] = useState(String(tracker?.value ?? 0));
  const [enabled, setEnabled] = useState(tracker?.enabled ?? false);
  const [visibility, setVisibility] = useState<StatTrackerVisibility>(
    tracker?.visibility ?? "gm",
  );
  const [canPlayerEdit, setCanPlayerEdit] = useState(
    tracker?.canPlayerEdit ?? false,
  );
  const [showOnToken, setShowOnToken] = useState(tracker?.showOnToken ?? false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      name,
      visualType,
      iconId,
      current: visualType === "bar" ? toNumber(current) : undefined,
      max: visualType === "bar" ? toNumber(max) : undefined,
      value:
        visualType === "counter" || visualType === "readonly"
          ? toNumber(value)
          : undefined,
      enabled: visualType === "toggle" ? enabled : undefined,
      visibility,
      canPlayerEdit,
      showOnToken,
    });
  }

  return (
    <div
      className="stat-tracker-modal__backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onCancel();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="stat-tracker-modal"
        role="dialog"
      >
        <header className="stat-tracker-modal__header">
          <div>
            <h2 id={titleId}>{tracker ? "Modifier le tracker" : "Ajouter un tracker"}</h2>
            <p>Configurez son affichage et les droits d’accès.</p>
          </div>

          <button
            aria-label="Fermer"
            className="stat-tracker-modal__close"
            onClick={onCancel}
            title="Fermer"
            type="button"
          >
            <X aria-hidden size={18} />
          </button>
        </header>

        <form className="stat-form stat-tracker-modal__form" onSubmit={submit}>
          <label>
            Nom
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nom du tracker"
              required
            />
          </label>

          <label>
            Type visuel
            <span className="stat-select-wrap">
              <select
                value={visualType}
                onChange={(event) =>
                  setVisualType(event.target.value as StatTrackerVisualType)
                }
              >
                {STAT_TRACKER_VISUAL_TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden size={15} />
            </span>
          </label>

          {visualType === "bar" ? (
            <>
              <label>
                Valeur actuelle
                <input
                  value={current}
                  onChange={(event) => setCurrent(event.target.value)}
                  type="number"
                />
              </label>

              <label>
                Valeur max
                <input
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                  type="number"
                />
              </label>
            </>
          ) : null}

          {visualType === "counter" || visualType === "readonly" ? (
            <label className="stat-tracker-modal__half-field">
              Valeur
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                type="number"
              />
            </label>
          ) : null}

          {visualType === "toggle" ? (
            <div className="stat-tracker-modal__half-field stat-setting-row">
              <div>
                <strong>État initial</strong>
                <span>{enabled ? "Actif" : "Inactif"}</span>
              </div>
              <Toggle checked={enabled} label="État activé" onChange={setEnabled} />
            </div>
          ) : null}

          <section className="stat-tracker-modal__section stat-form__wide">
            <div className="stat-tracker-modal__section-title">
              <strong>Icône</strong>
              <span>L’icône choisie porte l’identité visuelle du tracker.</span>
            </div>
            <StatTrackerIconPicker value={iconId} onChange={setIconId} />
          </section>

          <section className="stat-tracker-modal__section stat-form__wide">
            <div className="stat-tracker-modal__section-title">
              <strong>Accès & affichage</strong>
              <span>Contrôlez qui voit et qui peut modifier ce tracker.</span>
            </div>

            <div className="stat-tracker-modal__access-grid">
              <label>
                Visibilité
                <span className="stat-select-wrap">
                  <select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(event.target.value as StatTrackerVisibility)
                    }
                  >
                    {STAT_TRACKER_VISIBILITY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden size={15} />
                </span>
              </label>

              <div className="stat-setting-row">
                <div>
                  <strong>Modification joueur autorisée</strong>
                  <span>Autoriser les changements rapides si les droits le permettent.</span>
                </div>
                <Toggle
                  checked={canPlayerEdit}
                  label="Modification joueur autorisée"
                  onChange={setCanPlayerEdit}
                />
              </div>

              <div className="stat-setting-row">
                <div>
                  <strong>Afficher sur le token</strong>
                  <span>Inclure ce tracker dans l’affichage au-dessus du token.</span>
                </div>
                <Toggle
                  checked={showOnToken}
                  label="Afficher sur token"
                  onChange={setShowOnToken}
                />
              </div>
            </div>
          </section>

          <footer className="stat-form__actions stat-tracker-modal__footer">
            <Button className="stat-tracker-modal__cancel" onClick={onCancel}>
              Annuler
            </Button>
            <Button className="stat-tracker-modal__primary" type="submit">
              {tracker ? "Enregistrer" : "Ajouter"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
