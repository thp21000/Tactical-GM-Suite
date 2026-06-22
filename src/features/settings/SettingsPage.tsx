import { Button } from "../../shared/components/Button";
import { Panel } from "../../shared/components/Panel";

type SettingsPageProps = {
  onReset: () => void;
};

export function SettingsPage({ onReset }: SettingsPageProps) {
  return (
    <div className="stack">
      <Panel title="Paramètres locaux">
        <dl className="settings-list">
          <div>
            <dt>Thème</dt>
            <dd>Sombre</dd>
          </div>
          <div>
            <dt>Langue</dt>
            <dd>Français</dd>
          </div>
        </dl>
        <Button onClick={onReset}>Réinitialiser les préférences locales</Button>
      </Panel>

      <Panel title="Modules futurs">
        <p className="muted">
          Calendar et Loot Table apparaissent dans le registre pour préparer
          l’architecture, mais seront intégrés plus tard.
        </p>
      </Panel>
    </div>
  );
}
