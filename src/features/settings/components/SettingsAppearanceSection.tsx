import type { TgmTheme } from "../../../core/theme/obrTheme";

type SettingsAppearanceSectionProps = {
  theme: TgmTheme;
};

export function SettingsAppearanceSection({ theme }: SettingsAppearanceSectionProps) {
  return (
    <div className="settings-appearance stack">
      <dl className="settings-list">
        <div>
          <dt>Source thème</dt>
          <dd>{theme.source === "owlbear" ? "Owlbear" : "Neutral Glass"}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{theme.mode ?? "non disponible"}</dd>
        </div>
        <div>
          <dt>Accent</dt>
          <dd>{theme.accent ?? "non détecté"}</dd>
        </div>
        <div>
          <dt>Synchronisation</dt>
          <dd>Les couleurs suivent Owlbear quand l’API thème est disponible.</dd>
        </div>
      </dl>

      <div className="theme-preview-card">
        <div>
          <strong>Aperçu glass</strong>
          <span>Surface + accent du thème actif.</span>
        </div>
        <div className="theme-preview-swatches" aria-label="Aperçu des couleurs du thème">
          <span className="theme-swatch theme-swatch--accent" title="Accent" />
          <span className="theme-swatch theme-swatch--danger" title="Danger" />
          <span className="theme-swatch theme-swatch--warning" title="Warning" />
          <span className="theme-swatch theme-swatch--success" title="Success" />
        </div>
      </div>
    </div>
  );
}
