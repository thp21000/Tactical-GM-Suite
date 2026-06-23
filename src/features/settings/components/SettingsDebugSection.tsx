import { APP_VERSION } from "../../../core/constants/version";
import { EXTENSION_ID, ROOM_METADATA_KEYS, STORAGE_KEYS } from "../../../core/constants/ids";
import { moduleRegistry } from "../../../core/modules/moduleRegistry";
import type { ModuleStateMap } from "../../../core/modules/moduleState";
import type { ObrReadyState } from "../../../core/obr/obrReady";
import type { TgmTheme } from "../../../core/theme/obrTheme";
import { readJson } from "../../../core/storage/localStorage";
import type { InitiativeEncounterState } from "../../initiative/initiativeTypes";
import type { RangePreferences } from "../../range/rangeTypes";
import type { StatTrackerState } from "../../stats/statTypes";

export type SettingsDebugSectionProps = {
  obr: ObrReadyState;
  moduleStates: ModuleStateMap;
  theme: TgmTheme;
};

function formatEnabled(value: boolean): string {
  return value ? "oui" : "non";
}

export function SettingsDebugSection({ obr, moduleStates, theme }: SettingsDebugSectionProps) {
  const initiative = readJson<Partial<InitiativeEncounterState>>(STORAGE_KEYS.INITIATIVE_FALLBACK_STATE, {});
  const range = readJson<Partial<RangePreferences>>(STORAGE_KEYS.RANGE_PREFERENCES, {});
  const stats = readJson<Partial<StatTrackerState>>(STORAGE_KEYS.STAT_TRACKER_STATE, {});
  const enabledModules = moduleRegistry.filter((module) => moduleStates[module.id]);

  const summaryRows = [
    ["Extension", EXTENSION_ID],
    ["Version", APP_VERSION],
    ["OBR disponible", formatEnabled(obr.isAvailable)],
    ["OBR prêt", formatEnabled(obr.isReady)],
    ["Thème OBR disponible", formatEnabled(theme.source === "owlbear")],
    ["Source thème", theme.source],
    ["Mode thème", theme.mode ?? "non disponible"],
    ["Accent", theme.accent ?? "non disponible"],
    ["OBR background.default", theme.obr?.backgroundDefault ?? "non disponible"],
    ["OBR background.paper", theme.obr?.backgroundPaper ?? "non disponible"],
    ["Modules activés", `${enabledModules.length}/${moduleRegistry.length}`],
    ["Initiative", `${initiative.participants?.length ?? 0} participants · round ${initiative.round ?? 1}`],
    ["Distances", `${range.presets?.length ?? 0} presets · mode ${range.measurementMode ?? "défaut"}`],
    ["Stats", `${stats.entities?.length ?? 0} entités suivies`],
  ];

  return (
    <div className="settings-debug stack">
      <dl className="debug-summary">
        {summaryRows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="debug-compact-grid">
        <div>
          <h3>STORAGE_KEYS</h3>
          <pre>{JSON.stringify(STORAGE_KEYS, null, 2)}</pre>
        </div>
        <div>
          <h3>ROOM_METADATA_KEYS</h3>
          <pre>{JSON.stringify(ROOM_METADATA_KEYS, null, 2)}</pre>
        </div>
      </div>

      <div className="debug-module-list">
        {moduleRegistry.map((module) => (
          <div key={module.id}>
            <strong>{module.name}</strong>
            <span>{module.status} · {moduleStates[module.id] ? "activé" : "désactivé"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
