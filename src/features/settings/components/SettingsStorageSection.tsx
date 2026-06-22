import { Button } from "../../../shared/components/Button";

type SettingsStorageSectionProps = {
  onReset: () => void;
};

export function SettingsStorageSection({ onReset }: SettingsStorageSectionProps) {
  return (
    <div className="stack settings-storage-section">
      <p className="muted">
        Réinitialise les préférences locales de la suite. Les états partagés en room metadata ne sont pas supprimés ici.
      </p>
      <Button onClick={onReset}>Réinitialiser les préférences locales</Button>
    </div>
  );
}
