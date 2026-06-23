import type { TgmTheme } from "../../../core/theme/obrTheme";

type SettingsAppearanceSectionProps = {
  theme: TgmTheme;
};

export function SettingsAppearanceSection({ theme }: SettingsAppearanceSectionProps) {
  return (
    <dl className="settings-list">
      <div>
        <dt>Thème actuel</dt>
        <dd>{theme.source === "owlbear" ? "Owlbear" : "Neutral Glass"}</dd>
      </div>
      <div>
        <dt>Mode</dt>
        <dd>{theme.mode === "LIGHT" ? "clair" : "sombre"}</dd>
      </div>
      <div>
        <dt>Accent</dt>
        <dd>{theme.accent ?? "non détecté"}</dd>
      </div>
      <div>
        <dt>Synchronisation</dt>
        <dd>Les couleurs suivent le thème Owlbear quand l’API est disponible.</dd>
      </div>
    </dl>
  );
}
