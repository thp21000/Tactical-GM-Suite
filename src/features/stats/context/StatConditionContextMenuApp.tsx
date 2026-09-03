import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import {
  applyThemeVariables,
  createTgmThemeFromObrTheme,
  fallbackTgmTheme,
} from "../../../core/theme/obrTheme";
import { useAppPreferences } from "../../../core/preferences/AppPreferencesProvider";
import { useI18n } from "../../../i18n";
import type { InitiativeEncounterState } from "../../initiative/initiativeTypes";
import {
  readInitiativeState,
  subscribeToInitiativeState,
} from "../../initiative/services/initiativeStorage";
import type {
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
import {
  getSystemStatConditionDefinitions,
  type SystemStatConditionDefinition,
} from "../services/statConditionCatalog";
import { updateOrCreateEmbeddedConditionToken } from "../services/statEmbeddedProfileActions";
import { createOrUpdateTokenConditionOverlay } from "../services/statConditionOverlayObrSync";
import { isSupportedStatTokenItem } from "../services/statTokenEligibility";
import { readEmbeddedStatToken } from "../services/statTokenSceneLinks";
import { getTrackerIcon } from "../services/statTrackerIcons";
import "./statConditionContextMenu.css";

type EditorState = { conditionId: string };
type HoveredConditionState = {
  conditionId: string;
  top: number;
  bottom: number;
  left: number;
  width: number;
};
type CompactSelectOption = { value: string; label: string; disabled?: boolean };

type CompactSelectProps = {
  ariaLabel: string;
  value: string;
  options: readonly CompactSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

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
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
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
        <span className="stat-condition-context__select-chevron" aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div aria-label={ariaLabel} className="stat-condition-context__select-menu" role="listbox">
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
                type="button"
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                <span className="stat-condition-context__select-check" aria-hidden="true">
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

type QuickEditorProps = {
  definition: SystemStatConditionDefinition;
  condition?: StatTokenCondition;
  busy: boolean;
  isInInitiative: boolean;
  initiativeEncounterId?: string;
  initiativeRound?: number;
  onCancel: () => void;
  onSubmit: (config: StatConditionQuickConfig) => void;
};

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
  const { t } = useI18n();
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
    () => [
      { value: "manual", label: t("stats.conditions.duration.manual") },
      {
        value: "rounds",
        label: t("stats.conditions.duration.rounds"),
        disabled: !isInInitiative,
      },
      {
        value: "encounter",
        label: t("stats.conditions.duration.encounter"),
        disabled: !isInInitiative,
      },
      { value: "rest", label: t("stats.conditions.duration.rest") },
    ],
    [isInInitiative, t],
  );
  const visibilityOptions = useMemo<CompactSelectOption[]>(
    () => [
      { value: "public", label: t("stats.conditions.visibility.public") },
      { value: "private", label: t("stats.conditions.visibility.private") },
      { value: "gm", label: t("stats.conditions.visibility.gm") },
    ],
    [t],
  );

  return (
    <form
      className="stat-condition-context__editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          value: needsValue ? Math.max(1, Number(value) || 1) : undefined,
          durationType,
          rounds: durationType === "rounds" ? Math.max(1, Number(rounds) || 1) : undefined,
          visibility,
          initiativeEncounterId:
            durationType === "rounds" || durationType === "encounter"
              ? isInInitiative
                ? initiativeEncounterId
                : condition?.initiativeEncounterId
              : undefined,
          initiativeRound:
            durationType === "rounds" && isInInitiative ? initiativeRound : undefined,
        });
      }}
    >
      <div className="stat-condition-context__editor-header">
        <button
          aria-label={t("stats.conditions.editor.back")}
          className="stat-condition-context__back-button"
          type="button"
          onClick={onCancel}
        >
          ‹
        </button>
        <div className="stat-condition-context__editor-title">
          <span className="stat-condition-context__eyebrow">
            {condition ? t("stats.conditions.editor.edit") : t("stats.conditions.editor.add")}
          </span>
          <strong>{definition.label}</strong>
        </div>
      </div>

      <div className="stat-condition-context__editor-grid">
        {needsValue ? (
          <label>
            <span>
              {definition.valueLabelKey
                ? t(definition.valueLabelKey)
                : t("stats.conditions.editor.level")}
            </span>
            <input
              max={definition.maxValue}
              min="1"
              type="number"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
        ) : null}

        <label>
          <span>{t("stats.conditions.editor.duration")}</span>
          <CompactSelect
            ariaLabel={t("stats.conditions.editor.duration")}
            disabled={busy}
            options={durationOptions}
            value={durationType}
            onChange={(nextValue) => setDurationType(nextValue as StatConditionDurationType)}
          />
        </label>

        {durationType === "rounds" ? (
          <label>
            <span>{t("stats.conditions.editor.roundCount")}</span>
            <input
              disabled={!isInInitiative}
              min="1"
              title={!isInInitiative ? t("stats.conditions.initiative.required") : undefined}
              type="number"
              value={rounds}
              onChange={(event) => setRounds(event.target.value)}
            />
          </label>
        ) : null}

        <label>
          <span>{t("stats.conditions.editor.visibility")}</span>
          <CompactSelect
            ariaLabel={t("stats.conditions.editor.visibility")}
            disabled={busy}
            options={visibilityOptions}
            value={visibility}
            onChange={(nextValue) => setVisibility(nextValue as StatTrackerVisibility)}
          />
        </label>
      </div>

      <p className="stat-condition-context__hint">
        {isInInitiative
          ? t("stats.conditions.editor.hint.inInitiative")
          : t("stats.conditions.editor.hint.notInInitiative")}
      </p>

      <div className="stat-condition-context__editor-actions">
        <button type="button" onClick={onCancel} disabled={busy}>
          {t("stats.conditions.editor.cancel")}
        </button>
        <button className="is-primary" type="submit" disabled={busy}>
          {busy
            ? "…"
            : condition
              ? t("stats.conditions.editor.save")
              : t("stats.conditions.editor.add")}
        </button>
      </div>
    </form>
  );
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function StatConditionContextMenuApp() {
  const { gameSystem } = useAppPreferences();
  const { t } = useI18n();
  const definitions = useMemo(
    () => getSystemStatConditionDefinitions(gameSystem, t),
    [gameSystem, t],
  );
  const [token, setToken] = useState<StatTrackedToken | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [initiative, setInitiative] = useState<InitiativeEncounterState | null>(null);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [hoveredCondition, setHoveredCondition] = useState<HoveredConditionState | null>(null);
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
      setError(t("stats.conditions.error.readToken"));
    }
  }, [t]);

  useEffect(() => {
    setEditor(null);
    setQuery("");
    setHoveredCondition(null);
  }, [gameSystem]);

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
          if (mounted) applyThemeVariables(createTgmThemeFromObrTheme(obrTheme));
        })
        .catch(() => applyThemeVariables(fallbackTgmTheme));
      unsubscribeTheme = OBR.theme.onChange((obrTheme) => {
        applyThemeVariables(createTgmThemeFromObrTheme(obrTheme));
      });
      void readInitiativeState().then((state) => {
        if (mounted) setInitiative(state);
      });
      unsubscribeInitiative = subscribeToInitiativeState((state) => {
        if (mounted) setInitiative(state);
      });
      void refresh();
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

  const hoveredDefinition = useMemo(
    () => definitions.find((definition) => definition.id === hoveredCondition?.conditionId),
    [definitions, hoveredCondition?.conditionId],
  );

  const mutate = useCallback(
    async (update: (current: StatTrackedToken) => StatTrackedToken) => {
      if (!itemId) return;
      setBusy(true);
      setError(null);
      try {
        const updated = await updateOrCreateEmbeddedConditionToken(itemId, update);
        if (!updated) {
          setError(t("stats.conditions.error.tokenMissing"));
          return;
        }
        setToken(updated);
        await createOrUpdateTokenConditionOverlay(updated);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("stats.conditions.error.update"));
      } finally {
        setBusy(false);
      }
    },
    [itemId, t],
  );

  if (!itemId) {
    return (
      <main className="stat-condition-context stat-condition-context--empty">
        <p>{error ?? t("stats.conditions.empty.selectToken")}</p>
      </main>
    );
  }

  const isInInitiative =
    initiative?.participants.some((participant) => participant.sourceItemId === itemId) ?? false;
  const editorDefinition = editor
    ? definitions.find((definition) => definition.id === editor.conditionId)
    : undefined;
  const editorCondition =
    editorDefinition && token
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
              upsertQuickCondition(current, editorDefinition, config),
            ).then(() => setEditor(null));
          }}
        />
      </main>
    );
  }

  const hoverCardBelow = Boolean(hoveredCondition && hoveredCondition.top < 190);
  const hoverCardStyle = hoveredCondition
    ? {
        left: hoveredCondition.left,
        width: hoveredCondition.width,
        top: hoverCardBelow ? hoveredCondition.bottom + 5 : hoveredCondition.top - 5,
        transform: hoverCardBelow ? "none" : "translateY(-100%)",
      }
    : undefined;

  return (
    <main className="stat-condition-context">
      <div className="stat-condition-context__search-wrap">
        <span aria-hidden="true">⌕</span>
        <input
          autoComplete="off"
          placeholder={t("stats.conditions.search.placeholder")}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {hoveredDefinition ? (
        <aside
          className="stat-condition-context__hover-card"
          aria-live="polite"
          style={hoverCardStyle}
        >
          <strong>{hoveredDefinition.label}</strong>
          <span>{t("stats.conditions.hover.description")}</span>
          <p>{hoveredDefinition.description}</p>
          <span>{t("stats.conditions.hover.rulesSummary")}</span>
          <p>{hoveredDefinition.rulesSummary}</p>
        </aside>
      ) : null}

      {error ? <p className="stat-condition-context__error">{error}</p> : null}

      <div className="stat-condition-context__list" aria-label={t("stats.conditions.list.aria")}>
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
            ? getConditionDurationListText(active, t)
            : undefined;

          return (
            <div
              className={`stat-condition-context__condition${active ? " is-active" : ""}`}
              key={definition.id}
              onMouseEnter={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setHoveredCondition({
                  conditionId: definition.id,
                  top: rect.top,
                  bottom: rect.bottom,
                  left: rect.left,
                  width: rect.width,
                });
              }}
              onMouseLeave={() =>
                setHoveredCondition((current) =>
                  current?.conditionId === definition.id ? null : current,
                )
              }
            >
              <button
                className="stat-condition-context__condition-main"
                disabled={busy}
                type="button"
                onClick={() => {
                  if (active) {
                    void mutate((current) => removeQuickCondition(current, definition.id));
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
                  aria-label={t("stats.conditions.action.editNamed", { name: definition.label })}
                  className="stat-condition-context__edit"
                  disabled={busy}
                  type="button"
                  title={t("stats.conditions.action.editNamed", { name: definition.label })}
                  onClick={() => setEditor({ conditionId: definition.id })}
                >
                  ✎
                </button>
              ) : null}
            </div>
          );
        })}

        {gameSystem === "GENERIC" && filteredDefinitions.length === 0 ? (
          <p className="stat-condition-context__no-result">
            {t("stats.conditions.generic.empty")}
          </p>
        ) : filteredDefinitions.length === 0 ? (
          <p className="stat-condition-context__no-result">
            {t("stats.conditions.noResult")}
          </p>
        ) : null}
      </div>
    </main>
  );
}
