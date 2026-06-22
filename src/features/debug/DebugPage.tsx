import { EXTENSION_ID, ROOM_METADATA_KEYS, STORAGE_KEYS } from "../../core/constants/ids";
import { moduleRegistry } from "../../core/modules/moduleRegistry";
import type { ModuleStateMap } from "../../core/modules/moduleState";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { readJson } from "../../core/storage/localStorage";
import type { InitiativeEncounterState } from "../initiative/initiativeTypes";
import type { RangePreferences } from "../range/rangeTypes";
import type { StatTrackerState } from "../stats/statTypes";
import { Panel } from "../../shared/components/Panel";

type DebugPageProps = {
  obr: ObrReadyState;
  moduleStates: ModuleStateMap;
};

function formatEnabled(value: boolean): string {
  return value ? "oui" : "non";
}

export function DebugPage({ obr, moduleStates }: DebugPageProps) {
  const initiative = readJson<Partial<InitiativeEncounterState>>(
    STORAGE_KEYS.INITIATIVE_FALLBACK_STATE,
    {},
  );
  const range = readJson<Partial<RangePreferences>>(STORAGE_KEYS.RANGE_PREFERENCES, {});
  const stats = readJson<Partial<StatTrackerState>>(STORAGE_KEYS.STAT_TRACKER_STATE, {});
  const enabledModules = moduleRegistry.filter((module) => moduleStates[module.id]);

  const summaryRows = [
    ["Extension", EXTENSION_ID],
    ["Version", "0.2.6"],
    ["OBR disponible", formatEnabled(obr.isAvailable)],
    ["OBR prêt", formatEnabled(obr.isReady)],
    ["Modules activés", `${enabledModules.length}/${moduleRegistry.length}`],
    ["Initiative", `${initiative.participants?.length ?? 0} participants · round ${initiative.round ?? 1}`],
    ["Distances", `${range.presets?.length ?? 0} presets · mode ${range.measurementMode ?? "défaut"}`],
    ["Stats", `${stats.entities?.length ?? 0} entités suivies`],
  ];

  return (
    <div className="stack debug-page">
      <Panel title="Debug">
        <dl className="debug-summary">
          {summaryRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Clés de stockage">
        <pre>{JSON.stringify(STORAGE_KEYS, null, 2)}</pre>
      </Panel>

      <Panel title="Clés room metadata">
        <pre>{JSON.stringify(ROOM_METADATA_KEYS, null, 2)}</pre>
      </Panel>

      <Panel title="Modules">
        <div className="debug-module-list">
          {moduleRegistry.map((module) => (
            <div key={module.id}>
              <strong>{module.name}</strong>
              <span>{module.status} · {moduleStates[module.id] ? "activé" : "désactivé"}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
