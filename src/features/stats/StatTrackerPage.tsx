import { useState } from "react";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "../../shared/components/Badge";
import { Panel } from "../../shared/components/Panel";
import { StatBlockCard } from "./components/StatBlockCard";
import { StatBlockForm } from "./components/StatBlockForm";
import { StatSummaryPanel } from "./components/StatSummaryPanel";
import { StatTrackerEmptyState } from "./components/StatTrackerEmptyState";
import { StatTrackerToolbar } from "./components/StatTrackerToolbar";
import { useStatTrackerContextMenu } from "./hooks/useStatTrackerContextMenu";
import { useStatTrackerState } from "./hooks/useStatTrackerState";
type Props = { obr: ObrReadyState };
export function StatTrackerPage({ obr }: Props) { const [formOpen, setFormOpen] = useState(false); const stats = useStatTrackerState(obr.isReady); useStatTrackerContextMenu({ isReady: obr.isReady, onAddItems: stats.addItems }); return <div className="stack stat-page"><Panel><div className="stat-header"><div><p className="eyebrow">Bloc actif</p><h1>Stat Tracker</h1><p>Suivi visuel compact des créatures et tokens.</p></div><Badge tone={obr.isReady ? "success" : "warning"}>{obr.modeLabel}</Badge></div></Panel><Panel><StatSummaryPanel {...stats.summary} /></Panel><Panel><StatTrackerToolbar isFormOpen={formOpen} onReset={stats.resetTracker} onSort={stats.sortEntities} onToggleForm={() => setFormOpen((current) => !current)} />{formOpen ? <StatBlockForm onSubmit={(input) => { stats.addEntity(input); setFormOpen(false); }} /> : null}</Panel><Panel title="Entités suivies">{stats.entities.length === 0 ? <StatTrackerEmptyState /> : <div className="stat-list">{stats.entities.map((entity) => <StatBlockCard key={entity.id} entity={entity} onAddCondition={stats.addCondition} onAddResource={stats.addResource} onChangeHp={stats.changeHp} onChangeResource={stats.changeResource} onRemove={stats.removeEntity} onRemoveCondition={stats.removeCondition} onRemoveResource={stats.removeResource} onSetTempHp={stats.setTempHp} onToggleDefeated={stats.toggleDefeated} onToggleHidden={stats.toggleHidden} onUpdate={stats.updateEntity} />)}</div>}</Panel></div>; }
