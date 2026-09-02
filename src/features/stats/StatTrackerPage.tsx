import { useMemo, useState } from "react";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Panel } from "../../shared/components/Panel";
import { StatPresetManager } from "./components/StatPresetManager";
import { StatTokenForm } from "./components/StatTokenForm";
import { StatTrackedTokenBlock } from "./components/StatTrackedTokenBlock";
import { StatTrackerEmptyState } from "./components/StatTrackerEmptyState";
import { StatTrackerToolbar } from "./components/StatTrackerToolbar";
import { useStatPermissionViewer } from "./hooks/useStatPermissionViewer";
import { useStatSceneTokenBindings } from "./hooks/useStatSceneTokenBindings";
import { useStatTokenOverlayAutoSync } from "./hooks/useStatTokenOverlayAutoSync";
import { useStatTrackerState } from "./hooks/useStatTrackerState";
import { filterTokensForControlViewer } from "./services/statPermissions";
import type { StatTrackedToken } from "./statTypes";

type Props = {
  obr: ObrReadyState;
};

export function StatTrackerPage({ obr }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [presetPanelOpen, setPresetPanelOpen] = useState(false);
  const stats = useStatTrackerState(obr.isReady);
  const { isGm, viewer } = useStatPermissionViewer(obr.isReady);

  const sceneBindings = useStatSceneTokenBindings({
    enabled: obr.isReady,
    isGm,
    tokens: stats.tokens,
    onSceneItems: stats.hydrateSceneItems,
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
          tokens: filterTokensForControlViewer(
            group.tokens.flatMap(
              (token) => sceneTokensByCanonicalId.get(token.id) ?? [],
            ),
            viewer,
          ),
        }))
        .filter((group) => group.tokens.length > 0),
    [sceneTokensByCanonicalId, stats.displayGroups, viewer],
  );

  useStatTokenOverlayAutoSync({
    enabled: obr.isReady && sceneBindings.sceneReady && isGm,
    tokens: sceneBindings.sceneTokens,
  });

  return (
    <div className="stack stat-page">
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
                onAddTracker={stats.addTracker}
                onApplyPreset={stats.applyPresetToToken}
                onChangeTrackerValue={stats.changeTrackerValue}
                onRemoveToken={stats.removeToken}
                onRemoveTracker={stats.removeTracker}
                onToggleTracker={stats.toggleTracker}
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
