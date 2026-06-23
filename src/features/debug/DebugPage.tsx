import type { ModuleStateMap } from "../../core/modules/moduleState";
import type { ObrReadyState } from "../../core/obr/obrReady";
import type { TgmTheme } from "../../core/theme/obrTheme";
import { Panel } from "../../shared/components/Panel";
import { SettingsDebugSection } from "../settings/components/SettingsDebugSection";

type DebugPageProps = {
  obr: ObrReadyState;
  moduleStates: ModuleStateMap;
  theme: TgmTheme;
};

export function DebugPage({ obr, moduleStates, theme }: DebugPageProps) {
  return (
    <div className="stack debug-page">
      <Panel title="Debug">
        <p className="muted">
          Cette route reste disponible en accès direct. Le bloc Debug principal est désormais intégré dans Paramètres.
        </p>
      </Panel>
      <SettingsDebugSection obr={obr} moduleStates={moduleStates} theme={theme} />
    </div>
  );
}
