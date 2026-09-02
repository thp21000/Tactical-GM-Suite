import { useCallback, useEffect, useMemo, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import type {
  StatConditionDefinition,
  StatConditionDurationType,
  StatTrackerVisibility,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";
import { getConditionAssetUrl } from "../services/statConditionAssets";
import {
  getConditionDisplayName,
  getConditionDurationText,
  getActiveTokenCondition,
  removeQuickCondition,
  type StatConditionQuickConfig,
  upsertQuickCondition,
} from "../services/statConditionContextActions";
import { getStatConditionDefinitions } from "../services/statConditions";
import { updateEmbeddedStatToken } from "../services/statEmbeddedProfileActions";
import { createOrUpdateTokenConditionOverlay } from "../services/statConditionOverlayObrSync";
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
  onCancel: () => void;
  onSubmit: (config: StatConditionQuickConfig) => void;
};

const DURATION_OPTIONS: Array<{
  value: StatConditionDurationType;
  label: string;
}> = [
  { value: "manual", label: "Manuelle" },
  { value: "rounds", label: "Rounds" },
  { value: "encounter", label: "Rencontre" },
  { value: "rest", label: "Repos" },
];

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function QuickEditor({
  definition,
  condition,
  busy,
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

  return (
    <div className="stat-condition-context__editor-backdrop">
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
          });
        }}
      >
        <div className="stat-condition-context__editor-header">
          <div>
            <span className="stat-condition-context__eyebrow">
              {condition ? "Modifier la condition" : "Ajouter la condition"}
            </span>
            <strong>{definition.label}</strong>
          </div>
          <button
            aria-label="Fermer"
            className="stat-condition-context__icon-button"
            type="button"
            onClick={onCancel}
          >
            ×
          </button>
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
            <select
              value={durationType}
              onChange={(event) =>
                setDurationType(event.target.value as StatConditionDurationType)
              }
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {durationType === "rounds" ? (
            <label>
              <span>Nombre de rounds</span>
              <input
                min="1"
                type="number"
                value={rounds}
                onChange={(event) => setRounds(event.target.value)}
              />
            </label>
          ) : null}

          <label>
            <span>Visibilité</span>
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as StatTrackerVisibility)
              }
            >
              <option value="public">Public</option>
              <option value="private">Privé</option>
              <option value="gm">MJ</option>
            </select>
          </label>
        </div>

        <p className="stat-condition-context__hint">
          Une condition active est automatiquement affichée autour du token.
        </p>

        <div className="stat-condition-context__editor-actions">
          <button type="button" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
          <button className="is-primary" type="submit" disabled={busy}>
            {busy ? "Enregistrement…" : condition ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function StatConditionContextMenuApp() {
  const definitions = useMemo(() => getStatConditionDefinitions(), []);
  const [token, setToken] = useState<StatTrackedToken | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
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
      const embedded = item ? readEmbeddedStatToken(item) : undefined;
      setItemId(embedded?.isTracked === false ? null : selectedItemId);
      setToken(embedded?.isTracked === false ? null : embedded ?? null);
    } catch {
      setError("Impossible de lire le token sélectionné.");
    }
  }, []);

  useEffect(() => {
    let unsubscribePlayer = () => undefined;
    let unsubscribeItems = () => undefined;

    const unsubscribeReady = OBR.onReady(() => {
      void refresh();
      unsubscribePlayer = OBR.player.onChange(() => void refresh());
      unsubscribeItems = OBR.scene.items.onChange(() => void refresh());
    });

    return () => {
      unsubscribeReady();
      unsubscribePlayer();
      unsubscribeItems();
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
        const updated = await updateEmbeddedStatToken(itemId, update);
        if (!updated) {
          setError("Le profil Stats du token est introuvable.");
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

  if (!token) {
    return (
      <main className="stat-condition-context stat-condition-context--empty">
        <p>{error ?? "Sélectionnez un token suivi par le Stat Tracker."}</p>
      </main>
    );
  }

  const editorDefinition = editor
    ? definitions.find((definition) => definition.id === editor.conditionId)
    : undefined;
  const editorCondition = editorDefinition
    ? getActiveTokenCondition(token, editorDefinition.id)
    : undefined;

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
          const active = getActiveTokenCondition(token, definition.id);
          const assetUrl = getConditionAssetUrl({
            conditionId: definition.id,
            label: definition.label,
            shortLabel: definition.shortLabel,
          });
          const fallback = getTrackerIcon(definition.iconId);
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
                </span>
                {typeof active?.value === "number" ? (
                  <span className="stat-condition-context__condition-value">
                    {active.value}
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

      {editorDefinition ? (
        <QuickEditor
          key={`${editorDefinition.id}:${editorCondition?.updatedAt ?? "new"}`}
          definition={editorDefinition}
          condition={editorCondition}
          busy={busy}
          onCancel={() => setEditor(null)}
          onSubmit={(config) => {
            void mutate((current) =>
              upsertQuickCondition(current, editorDefinition.id, config),
            ).then(() => setEditor(null));
          }}
        />
      ) : null}
    </main>
  );
}
