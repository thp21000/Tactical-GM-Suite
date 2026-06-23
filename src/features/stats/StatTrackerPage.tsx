import { useState } from "react";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "../../shared/components/Badge";
import { Panel } from "../../shared/components/Panel";
import { StatSummaryPanel } from "./components/StatSummaryPanel";
import { StatTokenForm } from "./components/StatTokenForm";
import { StatTrackedTokenBlock } from "./components/StatTrackedTokenBlock";
import { StatTrackerEmptyState } from "./components/StatTrackerEmptyState";
import { StatTrackerToolbar } from "./components/StatTrackerToolbar";
import { useStatTrackerContextMenu } from "./hooks/useStatTrackerContextMenu";
import { useStatTrackerState } from "./hooks/useStatTrackerState";

type Props = {
  obr: ObrReadyState;
};

export function StatTrackerPage({ obr }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const stats = useStatTrackerState(obr.isReady);

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

          <Badge tone={obr.isReady ? "success" : "warning"}>
            {obr.modeLabel}
          </Badge>
        </div>
      </Panel>

      <Panel>
        <StatSummaryPanel {...stats.summary} />
      </Panel>

      <Panel>
        <StatTrackerToolbar
          isFormOpen={formOpen}
          onReset={stats.resetTracker}
          onToggleForm={() => setFormOpen((current) => !current)}
        />

        {formOpen ? (
          <StatTokenForm
            onSubmit={(input) => {
              stats.addToken(input);
              setFormOpen(false);
            }}
          />
        ) : null}
      </Panel>

      <Panel title="Tokens suivis">
        {stats.tokens.length === 0 ? (
          <StatTrackerEmptyState />
        ) : (
          <div className="stat-list">
            {stats.displayGroups.map((group) => (
              <StatTrackedTokenBlock
                key={group.id}
                group={group}
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
