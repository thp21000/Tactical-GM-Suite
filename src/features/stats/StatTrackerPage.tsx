import { useMemo, useState } from "react";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "../../shared/components/Badge";
import { Panel } from "../../shared/components/Panel";
import { StatPresetManager } from "./components/StatPresetManager";
import { StatSummaryPanel } from "./components/StatSummaryPanel";
import { StatTokenForm } from "./components/StatTokenForm";
import { StatTrackedTokenBlock } from "./components/StatTrackedTokenBlock";
import { StatTrackerEmptyState } from "./components/StatTrackerEmptyState";
import { StatTrackerToolbar } from "./components/StatTrackerToolbar";
import { useStatPermissionViewer } from "./hooks/useStatPermissionViewer";
import { useStatTrackerContextMenu } from "./hooks/useStatTrackerContextMenu";
import { useStatTrackerState } from "./hooks/useStatTrackerState";
import { filterTokensForViewer } from "./services/statPermissions";

type Props = {
  obr: ObrReadyState;
};

export function StatTrackerPage({ obr }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [presetPanelOpen, setPresetPanelOpen] = useState(false);
  const stats = useStatTrackerState(obr.isReady);
  const { isGm, viewer, viewerLabel } = useStatPermissionViewer(obr.isReady);
  const visibleDisplayGroups = useMemo(() => stats.displayGroups
    .map((group) => ({ ...group, tokens: filterTokensForViewer(group.tokens, viewer) }))
    .filter((group) => group.tokens.length > 0), [stats.displayGroups, viewer]);

  useStatTrackerContextMenu({
    isReady: obr.isReady,
    onAddItems: stats.addItems,
  });

  return (
    <div className="stack stat-page">
      <Panel>
        <div className="stat-header">
          <div>
            <p className="eyebrow">Tokens suivis</p>
            <h1>Stat Tracker</h1>
            <p>
              Trackers personnalisables attachés aux tokens Owlbear ou ajoutés
              manuellement.
            </p>
          </div>

          <div className="stat-header__badges">
            <Badge tone={obr.isReady ? "success" : "warning"}>
              {obr.modeLabel}
            </Badge>
            <Badge>{viewerLabel}</Badge>
          </div>
        </div>
      </Panel>

      <Panel>
        <StatSummaryPanel {...stats.summary} />
      </Panel>

      {isGm ? (
        <Panel>
          <StatTrackerToolbar
            isFormOpen={formOpen}
            onReset={stats.resetTracker}
            onToggleForm={() => setFormOpen((current) => !current)}
          />

          <div className="stat-card__actions">
            <button
              className="button"
              type="button"
              onClick={() => setPresetPanelOpen((current) => !current)}
            >
              {presetPanelOpen ? "Masquer les presets" : "Gérer les presets"}
            </button>
          </div>

          {formOpen ? (
            <StatTokenForm
              onSubmit={(input) => {
                stats.addToken(input);
                setFormOpen(false);
              }}
            />
          ) : null}
        </Panel>
      ) : null}

      {isGm && presetPanelOpen ? (
        <Panel title="Presets Stats">
          <StatPresetManager
            presets={stats.presets}
            onAddTracker={stats.addTrackerToPreset}
            onRemoveTracker={stats.removeTrackerFromPreset}
            onResetPreset={stats.resetPreset}
            onResetPresets={stats.resetPresets}
          />
        </Panel>
      ) : null}

      <Panel title="Tokens suivis">
        {visibleDisplayGroups.length === 0 ? (
          <StatTrackerEmptyState />
        ) : (
          <div className="stat-list">
            {visibleDisplayGroups.map((group) => (
              <StatTrackedTokenBlock
                key={group.id}
                group={group}
                isGm={isGm}
                viewer={viewer}
                onAddCondition={stats.addConditionToToken}
                onClearConditionDuration={stats.clearConditionDuration}
                onAddTracker={stats.addTracker}
                onApplyPreset={stats.applyPresetToToken}
                onChangeTrackerValue={stats.changeTrackerValue}
                onDecrementConditionDuration={stats.decrementConditionDuration}
                onRemoveCondition={stats.removeConditionFromToken}
                onRemoveToken={stats.removeToken}
                onRemoveTracker={stats.removeTracker}
                onToggleTracker={stats.toggleTracker}
                onUpdateCondition={stats.updateConditionOnToken}
                onUpdateToken={stats.updateToken}
                onUpdateTracker={stats.updateTracker}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
