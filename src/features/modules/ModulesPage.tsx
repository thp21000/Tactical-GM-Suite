import { moduleRegistry } from "../../core/modules/moduleRegistry";
import type { ModuleStateMap } from "../../core/modules/moduleState";
import { Panel } from "../../shared/components/Panel";
import { ModuleCard } from "./ModuleCard";
export function ModulesPage({ moduleStates, onToggleModule }: { moduleStates: ModuleStateMap; onToggleModule: (id: string, enabled: boolean) => void }) { return <Panel title="Modules"><div className="module-grid">{moduleRegistry.map((module) => <ModuleCard key={module.id} module={module} enabled={moduleStates[module.id]} onToggle={(enabled) => onToggleModule(module.id, enabled)}/>)}</div></Panel>; }
