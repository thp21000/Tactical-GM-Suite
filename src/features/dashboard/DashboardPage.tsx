import { moduleRegistry } from "../../core/modules/moduleRegistry";
import {
  countEnabledModules,
  type ModuleStateMap,
} from "../../core/modules/moduleState";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "../../shared/components/Badge";
import { Panel } from "../../shared/components/Panel";

type DashboardPageProps = {
  obr: ObrReadyState;
  moduleStates: ModuleStateMap;
};

export function DashboardPage({ obr, moduleStates }: DashboardPageProps) {
  const previewModules = moduleRegistry.slice(0, 4);

  return (
    <div className="stack">
      <Panel>
        <div className="hero">
          <div>
            <p className="eyebrow">Extension Owlbear Rodeo</p>
            <h1>Tactical GM Suite</h1>
            <p>Version 0.1.0 · Core / Dashboard V1</p>
          </div>
<<<<<<< ours
          <Badge tone="warning">Prochain bloc : Initiative Tracker</Badge>
=======
          <Badge tone="warning">Bloc actif : Initiative Tracker</Badge>
>>>>>>> theirs
        </div>
      </Panel>

      <div className="metrics">
        <Panel>
          <strong>{obr.isAvailable ? "Disponible" : "Non disponible"}</strong>
          <span>OBR</span>
        </Panel>
        <Panel>
          <strong>{obr.isReady ? "Prêt" : "Non prêt"}</strong>
          <span>État Owlbear</span>
        </Panel>
        <Panel>
          <strong>{countEnabledModules(moduleStates)}</strong>
          <span>Modules activés</span>
        </Panel>
      </div>

      <Panel title="Modules principaux">
        <div className="compact-cards">
          {previewModules.map((module) => (
            <div key={module.id} className="compact-card">
              <Badge>{module.shortName}</Badge>
              <strong>{module.name}</strong>
              <p>{module.description}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
