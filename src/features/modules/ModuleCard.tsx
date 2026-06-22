import type { GmSuiteModule } from "../../core/modules/moduleTypes";
import { Badge } from "../../shared/components/Badge";
import { Toggle } from "../../shared/components/Toggle";
const statusTone = { core: "success", next: "warning", planned: "default", future: "default", disabled: "danger" } as const;
export function ModuleCard({ module, enabled, onToggle }: { module: GmSuiteModule; enabled: boolean; onToggle: (enabled: boolean) => void }) { return <article className="module-card"><div className="module-card__header"><div><h3>{module.name}</h3><span>{module.shortName}</span></div><Badge tone={statusTone[module.status]}>{module.status}</Badge></div><p>{module.description}</p><div className="module-card__footer"><span className={enabled ? "state-on" : "state-off"}>{enabled ? "Activé" : "Désactivé"}</span>{module.canDisable ? <Toggle checked={enabled} onChange={onToggle} label={`Basculer ${module.name}`}/> : <Badge tone="success">verrouillé</Badge>}</div></article>; }
