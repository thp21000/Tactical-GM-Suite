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
import { useStatSceneTokenBindings } from "./hooks/useStatSceneTokenBindings";
import { useStatTokenOverlayAutoSync } from "./hooks/useStatTokenOverlayAutoSync";
import { useStatTrackerContextMenu } from "./hooks/useStatTrackerContextMenu";
import { useStatTrackerState } from "./hooks/useStatTrackerState";
import { filterTokensForViewer } from "./services/statPermissions";
import { getTokenDisplayItems } from "./services/statTokenDisplay";
import type { StatTrackedToken } from "./statTypes";

type Props = {
  obr: ObrReadyState;
};

export function StatTrackerPage({ obr }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [presetPanelOpen, setPresetPanelOpen] = useState(false);
  const stats = useStatTrackerState(obr.isReady);
  const { isGm, viewer, viewerLabel } = useStatPermissionViewer(obr.isReady);

  const sceneBindings = useStatSceneTokenBindings({
    enabled: obr.isReady,
    isGm,
    tokens: stats.tokens,
  });

  const sceneTokensByCanonicalId = useMemo(() => {
    const result = new Map<string, StatTrackedToken[]>();
    for (const token of sceneBindings.sceneTokens) {
      const existing = result.get(token.id) ?? [];
      existing.push(token);
      result.set(token.id, existing);
    }
    return result;
  }, [sceneBindings.sceneTokens]);

  const visibleDisplayGroups = useMemo(
    () =>
      stats.displayGroups
        .map((group) => ({
          ...group,
          tokens: filterTokensForViewer(
            group.tokens.flatMap(
              (token) => sceneTokensByCanonicalId.get(token.id) ?? [],
            ),
            viewer,
          ),
        }))
        .filter((group) => group.tokens.length > 0),
    [sceneTokensByCanonicalId, stats.displayGroups, viewer],
  );

  const sceneSummary = useMemo(() => {
    const tokens = visibleDisplayGroups.flatMap((group) => group.tokens);
    return {
      tokenCount: tokens.length,
      trackerCount: tokens.reduce(
        (total, token) => total + token.trackers.length,
        0,
      ),
      groupCount: visibleDisplayGroups.filter((group) => group.isGroup).length,
      visibleOnTokenCount: tokens.reduce(
        (total, token) => total + getTokenDisplayItems(token).length,
        0,
      ),
    };
  }, [visibleDisplayGroups]);

  const overlayAutoSync = useStatTokenOverlayAutoSync({
    enabled: obr.isReady && sceneBindings.sceneReady && isGm,
    tokens: sceneBindings.sceneTokens,
  });

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
            {obr.isReady ? (
              <Badge tone={sceneBindings.sceneReady ? "success" : "warning"}>
                {sceneBindings.sceneReady
                  ? `Scène : ${sceneBindings.sceneTokens.length} token${sceneBindings.sceneTokens.length > 1 ? "s" : ""}`
                  : "Scène en chargement…"}
              </Badge>
            ) : null}
            {isGm && obr.isReady && sceneBindings.sceneReady ? (
              <Badge
                tone={
                  overlayAutoSync.lastError
                    ? "warning"
                    : overlayAutoSync.isSyncing
                      ? "warning"
                      : "success"
                }
              >
                {overlayAutoSync.lastError
                  ? "Affichage auto : erreur"
                  : overlayAutoSync.isSyncing
                    ? "Affichage auto : MAJ…"
                    : "Affichage token : auto"}
              </Badge>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel>
        <StatSummaryPanel {...sceneSummary} />
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
