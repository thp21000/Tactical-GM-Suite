import { moduleRegistry } from "../../../core/modules/moduleRegistry";
import type { ModuleStateMap } from "../../../core/modules/moduleState";
import { ModuleCard } from "../../modules/ModuleCard";

type SettingsModulesSectionProps = {
  moduleStates: ModuleStateMap;
  onToggleModule: (moduleId: string, enabled: boolean) => void;
};

export function SettingsModulesSection({ moduleStates, onToggleModule }: SettingsModulesSectionProps) {
  return (
    <div className="module-grid settings-module-grid">
      {moduleRegistry.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          enabled={moduleStates[module.id]}
          onToggle={(enabled) => onToggleModule(module.id, enabled)}
        />
      ))}
      <p className="muted">
        Calendar et Loot Table restent reportés : ils existent déjà en standalone et seront intégrés plus tard.
      </p>
    </div>
  );
}
