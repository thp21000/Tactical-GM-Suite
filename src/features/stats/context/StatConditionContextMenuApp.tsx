import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import {
  applyThemeVariables,
  createTgmThemeFromObrTheme,
  fallbackTgmTheme,
} from "../../../core/theme/obrTheme";
import type { InitiativeEncounterState } from "../../initiative/initiativeTypes";
import {
  readInitiativeState,
  subscribeToInitiativeState,
} from "../../initiative/services/initiativeStorage";
import type {
  StatConditionDefinition,
  StatConditionDurationType,
  StatTrackerVisibility,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";
import { getConditionAssetUrl } from "../services/statConditionAssets";
import {
  getActiveTokenCondition,
  getConditionDisplayName,
  getConditionDurationListText,
  getConditionDurationText,
  removeQuickCondition,
  type StatConditionQuickConfig,
  upsertQuickCondition,
} from "../services/statConditionContextActions";
import { getStatConditionDefinitions } from "../services/statConditions";
import { updateOrCreateEmbeddedConditionToken } from "../services/statEmbeddedProfileActions";
import { createOrUpdateTokenConditionOverlay } from "../services/statConditionOverlayObrSync";
import { isSupportedStatTokenItem } from "../services/statTokenEligibility";
import { readEmbeddedStatToken } from "../services/statTokenSceneLinks";
import { getTrackerIcon } from "../services/statTrackerIcons";
import "./statConditionContextMenu.css";

type EditorState = {
  conditionId: string;
};

type QuickEditorProps = {
  definition: StatConditionDefinition;
  condition?: StatTokenCondition;
  busy: boolean;
  isInInitiative: boolean;
  initiativeEncounterId?: string;
  initiativeRound?: number;
  onCancel: () => void;
  onSubmit: (config: StatConditionQuickConfig) => void;
};

type CompactSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CompactSelectProps = {
  ariaLabel: string;
  value: string;
  options: readonly CompactSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

const BASE_DURATION_OPTIONS: Array<{
  value: StatConditionDurationType;
  label: string;
}> = [
  { value: "manual", label: "Manuelle" },
  { value: "rounds", label: "Rounds" },
  { value: "encounter", label: "Rencontre" },
  { value: "rest", label: "Repos" },
];

const VISIBILITY_OPTIONS: Array<{
  value: StatTrackerVisibility;
  label: string;
}> = [
  { value: "public", label: "Public" },
  { value: "private", label: "Privé" },
  { value: "gm", label: "MJ" },
];

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function CompactSelect({
  ariaLabel,
  value,
  options,
  disabled = false,
  onChange,
}: CompactSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`stat-condition-context__select${open ? " is-open" : ""}`}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="stat-condition-context__select-trigger"
        disabled={disabled}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label ?? value}</span>
        <span className="stat-condition-context__select-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          aria-label={ariaLabel}
          className="stat-condition-context__select-menu"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                aria-disabled={option.disabled || undefined}
                aria-selected={isSelected}
                className={`stat-condition-context__select-option${isSelected ? " is-selected" : ""}`}
                disabled={option.disabled}
                key={option.value}
                role="option"
                title={
                  option.disabled
                    ? "Ajoutez d’abord ce token à l’initiative."
                    : undefined
                }
                type="button"
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                <span
                  className="stat-condition-context__select-check"
                  aria-hidden="true"
                >
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function QuickEditor({
  definition,
  condition,
  busy,
  isInInitiative,
  initiativeEncounterId,
  initiativeRound,
  onCancel,
  onSubmit,
}: QuickEditorProps) {
  const needsValue = definition.severityType !== "none";
  const [value, setValue] = useState(String(condition?.value ?? 1));
  const [durationType, setDurationType] = useState<StatConditionDurationType>(
    condition?.durationType ?? "manual",
  );
  const [rounds, setRounds] = useState(
    String(condition?.remainingRounds ?? condition?.durationValue ?? 1),
  );
  const [visibility, setVisibility] = useState<StatTrackerVisibility>(
    condition?.visibility ?? "public",
  );
  const durationOptions = useMemo<CompactSelectOption[]>(
    () =>
      BASE_DURATION_OPTIONS.map((option) => ({
        ...option,
        disabled:
          !isInInitiative &&
          (option.value === "rounds" || option.value === "encounter"),
      })),
    [isInInitiative],
  );

  return (
    <form
      className="stat-condition-context__editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          value: needsValue ? Math.max(1, Number(value) || 1) : undefined,
          durationType,
          rounds:
            durationType === "rounds"
              ? Math.max(1, Number(rounds) || 1)
              : undefined,
          visibility,
          initiativeEncounterId:
            durationType === "rounds" || durationType === "encounter"
              ? isInInitiative
                ? initiativeEncounterId
                : condition?.initiativeEncounterId
              : undefined,
          initiativeRound:
            durationType === "rounds" && isInInitiative
              ? initiativeRound
              : undefined,
        });
      }}
    >
      <div className="stat-condition-context__editor-header">
        <button
          aria-label="Retour à la liste des conditions"
          className="stat-condition-context__back-button"
          type="button"
          onClick={onCancel}
        >
          ‹
        </button>
        <div className="stat-condition-context__editor-title">
          <span className="stat-condition-context__eyebrow">
            {condition ? "Modifier" : "Ajouter"}
          </span>
          <strong>{definition.label}</strong>
        </div>
      </div>

      <div className="stat-condition-context__editor-grid">
        {needsValue ? (
          <label>
            <span>Niveau</span>
            <input
              min="1"
              type="number"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
        ) : null}

        <label>
          <span>Durée</span>
          <CompactSelect
            ariaLabel="Durée"
            disabled={busy}
            options={durationOptions}
            value={durationType}
            onChange={(nextValue) =>
              setDurationType(nextValue as StatConditionDurationType)
            }
          />
        </label>

        {durationType === "rounds" ? (
          <label>
            <span>Nombre de rounds</span>
            <input
              disabled={!isInInitiative}
              min="1"
              title={
                !isInInitiative
                  ? "Ajoutez d’abord ce token à l’initiative."
                  : undefined
              }
              type="number"
              value={rounds}
              onChange={(event) => setRounds(event.target.value)}
            />
          </label>
        ) : null}

        <label>
          <span>Visibilité</span>
          <CompactSelect
            ariaLabel="Visibilité"
            disabled={busy}
            options={VISIBILITY_OPTIONS}
            value={visibility}
            onChange={(nextValue) =>
              setVisibility(nextValue as StatTrackerVisibility)
            }
          />
        </label>
      </div>

      <p className="stat-condition-context__hint">
        {isInInitiative
          ? "Affichée automatiquement sur le token selon sa visibilité."
          : "Rounds et Rencontre deviennent disponibles quand ce token est ajouté à l’initiative."}
      </p>

      <div className="stat-condition-context__editor-actions">
        <button type="button" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
        <button className="is-primary" type="submit" disabled={busy}>
          {busy ? "…" : condition ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

export function StatConditionContextMenuApp() {
  const definitions = useMemo(() => getStatConditionDefinitions(), []);
  const [token, setToken] = useState<StatTrackedToken | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [initiative, setInitiative] = useState<InitiativeEncounterState | null>(null);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const selection = await OBR.player.getSelection();
      const selectedItemId = selection?.length === 1 ? selection[0] : undefined;
      if (!selectedItemId) {
        setItemId(null);
        setToken(null);
        return;
      }

      const [item] = await OBR.scene.items.getItems([selectedItemId]);
      if (!item || !isSupportedStatTokenItem(item)) {
        setItemId(null);
        setToken(null);
        return;
      }

      setItemId(selectedItemId);
      setToken(readEmbeddedStatToken(item) ?? null);
      setError(null);
    } catch {
      setError("Impossible de lire le token sélectionné.");
    }
  }, []);

  useEffect(() => {
    let unsubscribePlayer: (() => void) | undefined;
    let unsubscribeItems: (() => void) | undefined;
    let unsubscribeTheme: (() => void) | undefined;
    let unsubscribeInitiative: (() => void) | undefined;
    let mounted = true;

    document.body.classList.add("stat-condition-context-host");
    applyThemeVariables(fallbackTgmTheme);

    OBR.onReady(() => {
      if (!mounted) return;

      void OBR.theme
        .getTheme()
        .then((obrTheme) => {
          if (mounted) {
            applyThemeVariables(createTgmThemeFromObrTheme(obrTheme));
          }
        })
        .catch(() => applyThemeVariables(fallbackTgmTheme));

      unsubscribeTheme?.();
      unsubscribeTheme = OBR.theme.onChange((obrTheme) => {
        applyThemeVariables(createTgmThemeFromObrTheme(obrTheme));
      });

      void readInitiativeState()
        .then((state) => {
          if (mounted) setInitiative(state);
        })
        .catch(() => undefined);
      unsubscribeInitiative?.();
      unsubscribeInitiative = subscribeToInitiativeState((state) => {
        if (mounted) setInitiative(state);
      });

      void refresh();
      unsubscribePlayer?.();
      unsubscribeItems?.();
      unsubscribePlayer = OBR.player.onChange(() => void refresh());
      unsubscribeItems = OBR.scene.items.onChange(() => void refresh());
    });

    return () => {
      mounted = false;
      document.body.classList.remove("stat-condition-context-host");
      unsubscribePlayer?.();
      unsubscribeItems?.();
      unsubscribeTheme?.();
      unsubscribeInitiative?.();
    };
  }, [refresh]);

  const filteredDefinitions = useMemo(() => {
    const needle = normalizeSearch(query.trim());
    if (!needle) return definitions;
    return definitions.filter((definition) =>
      normalizeSearch(definition.label).includes(needle),
    );
  }, [definitions, query]);

  const mutate = useCallback(
    async (update: (current: StatTrackedToken) => StatTrackedToken) => {
      if (!itemId) return;
      setBusy(true);
      setError(null);
      try {
        const updated = await updateOrCreateEmbeddedConditionToken(itemId, update);
        if (!updated) {
          setError("Le token est introuvable.");
          return;
        }
        setToken(updated);
        await createOrUpdateTokenConditionOverlay(updated);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible de modifier la condition.",
        );
      } finally {
        setBusy(false);
      }
    },
    [itemId],
  );

  if (!itemId) {
    return (
      <main className="stat-condition-context stat-condition-context--empty">
        <p>{error ?? "Sélectionnez un token."}</p>
      </main>
    );
  }

  const isInInitiative =
    initiative?.participants.some(
      (participant) => participant.sourceItemId === itemId,
    ) ?? false;
  const editorDefinition = editor
    ? definitions.find((definition) => definition.id === editor.conditionId)
    : undefined;
  const editorCondition = editorDefinition && token
    ? getActiveTokenCondition(token, editorDefinition.id)
    : undefined;

  if (editorDefinition) {
    return (
      <main className="stat-condition-context stat-condition-context--editor">
        <QuickEditor
          key={`${editorDefinition.id}:${editorCondition?.updatedAt ?? "new"}`}
          definition={editorDefinition}
          condition={editorCondition}
          busy={busy}
          isInInitiative={isInInitiative}
          initiativeEncounterId={initiative?.id}
          initiativeRound={initiative?.round}
          onCancel={() => setEditor(null)}
          onSubmit={(config) => {
            void mutate((current) =>
              upsertQuickCondition(current, editorDefinition.id, config),
            ).then(() => setEditor(null));
          }}
        />
      </main>
    );
  }

  return (
    <main className="stat-condition-context">
      <div className="stat-condition-context__search-wrap">
        <span aria-hidden="true">⌕</span>
        <input
          autoComplete="off"
          placeholder="Rechercher une condition"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error ? <p className="stat-condition-context__error">{error}</p> : null}

      <div className="stat-condition-context__list" aria-label="Conditions">
        {filteredDefinitions.map((definition) => {
          const active = token
            ? getActiveTokenCondition(token, definition.id)
            : undefined;
          const assetUrl = getConditionAssetUrl({
            conditionId: definition.id,
            label: definition.label,
            shortLabel: definition.shortLabel,
          });
          const fallback = getTrackerIcon(definition.iconId);
          const durationListText = active
            ? getConditionDurationListText(active)
            : undefined;
          const title = active
            ? `${getConditionDisplayName(active)} · ${getConditionDurationText(active)}`
            : definition.description ?? definition.label;

          return (
            <div
              className={`stat-condition-context__condition${active ? " is-active" : ""}`}
              key={definition.id}
              title={title}
            >
              <button
                className="stat-condition-context__condition-main"
                disabled={busy}
                type="button"
                onClick={() => {
                  if (active) {
                    void mutate((current) =>
                      removeQuickCondition(current, definition.id),
                    );
                  } else {
                    setEditor({ conditionId: definition.id });
                  }
                }}
              >
                <span className="stat-condition-context__condition-icon" aria-hidden="true">
                  {assetUrl ? (
                    <img src={assetUrl} alt="" />
                  ) : fallback.src ? (
                    <img src={fallback.src} alt="" />
                  ) : (
                    fallback.symbol
                  )}
                </span>
                <span className="stat-condition-context__condition-label">
                  {definition.label}
                  {typeof active?.value === "number" ? (
                    <span className="stat-condition-context__condition-level">
                      {` + ${active.value}`}
                    </span>
                  ) : null}
                </span>
                {durationListText ? (
                  <span className="stat-condition-context__condition-duration">
                    {durationListText}
                  </span>
                ) : null}
              </button>

              {active ? (
                <button
                  aria-label={`Modifier ${definition.label}`}
                  className="stat-condition-context__edit"
                  disabled={busy}
                  type="button"
                  title={`Modifier ${definition.label}`}
                  onClick={() => setEditor({ conditionId: definition.id })}
                >
                  ✎
                </button>
              ) : null}
            </div>
          );
        })}

        {filteredDefinitions.length === 0 ? (
          <p className="stat-condition-context__no-result">Aucune condition trouvée.</p>
        ) : null}
      </div>
    </main>
  );
}
