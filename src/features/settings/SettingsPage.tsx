import type { ModuleStateMap } from "../../core/modules/moduleState";
import type { ObrReadyState } from "../../core/obr/obrReady";
import type { TgmTheme } from "../../core/theme/obrTheme";
import { CollapsibleSection } from "../../shared/components/CollapsibleSection";
import { Panel } from "../../shared/components/Panel";
import { SettingsAboutSection } from "./components/SettingsAboutSection";
import { SettingsAppearanceSection } from "./components/SettingsAppearanceSection";
import { SettingsDebugSection } from "./components/SettingsDebugSection";
import { SettingsModulesSection } from "./components/SettingsModulesSection";
import { SettingsStorageSection } from "./components/SettingsStorageSection";

type SettingsPageProps = {
  obr: ObrReadyState;
  moduleStates: ModuleStateMap;
  onToggleModule: (moduleId: string, enabled: boolean) => void;
  onReset: () => void;
  theme: TgmTheme;
};

export function SettingsPage({ obr, moduleStates, onToggleModule, onReset, theme }: SettingsPageProps) {
  return (
    <div className="stack settings-page">
      <Panel title="Paramètres">
        <p className="muted">
          Administration centrale de Tactical GM Suite : apparence, modules, debug, stockage et version.
        </p>
      </Panel>

      <CollapsibleSection title="Apparence / Thème" summary="Neutral Glass" defaultOpen>
        <SettingsAppearanceSection theme={theme} />
      </CollapsibleSection>

      <CollapsibleSection title="Modules" summary="Activation et roadmap">
        <SettingsModulesSection moduleStates={moduleStates} onToggleModule={onToggleModule} />
      </CollapsibleSection>

      <CollapsibleSection title="Debug" summary="Résumés techniques compacts">
        <SettingsDebugSection obr={obr} moduleStates={moduleStates} theme={theme} />
      </CollapsibleSection>

      <CollapsibleSection title="Stockage / Réinitialisation" summary="Préférences locales">
        <SettingsStorageSection onReset={onReset} />
      </CollapsibleSection>

      <CollapsibleSection title="À propos / Version" summary="V1 stabilisée">
        <SettingsAboutSection obr={obr} />
      </CollapsibleSection>
    </div>
  );
}
