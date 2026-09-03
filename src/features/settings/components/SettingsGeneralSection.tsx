import type {
  GameSystemPreference,
  LanguagePreference,
} from "../../../core/config/appOptions";
import { useAppPreferences } from "../../../core/preferences/AppPreferencesProvider";
import { useI18n } from "../../../i18n";

const LANGUAGE_OPTIONS: Array<{
  id: LanguagePreference;
  labelKey: string;
  shortLabel: string;
}> = [
  { id: "fr", labelKey: "settings.general.language.fr", shortLabel: "FR" },
  { id: "en", labelKey: "settings.general.language.en", shortLabel: "EN" },
];

const SYSTEM_OPTIONS: Array<{
  id: GameSystemPreference;
  labelKey: string;
}> = [
  { id: "DND5E", labelKey: "settings.general.system.dnd5e" },
  { id: "PF2E", labelKey: "settings.general.system.pf2e" },
  { id: "GENERIC", labelKey: "settings.general.system.generic" },
];

export function SettingsGeneralSection() {
  const { language, gameSystem, setGameSystem, setLanguage } = useAppPreferences();
  const { t } = useI18n();

  return (
    <div className="settings-general">
      <section className="settings-preference-group">
        <div>
          <strong>{t("settings.general.language.label")}</strong>
          <p className="muted">{t("settings.general.language.help")}</p>
        </div>

        <div className="settings-choice-grid settings-choice-grid--language">
          {LANGUAGE_OPTIONS.map((option) => {
            const active = language === option.id;
            return (
              <button
                aria-pressed={active}
                className={`settings-choice${active ? " settings-choice--active" : ""}`}
                key={option.id}
                type="button"
                onClick={() => setLanguage(option.id)}
              >
                <span className="settings-choice__code">{option.shortLabel}</span>
                <span>{t(option.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-preference-group">
        <div>
          <strong>{t("settings.general.system.label")}</strong>
          <p className="muted">{t("settings.general.system.help")}</p>
        </div>

        <div className="settings-choice-grid settings-choice-grid--system">
          {SYSTEM_OPTIONS.map((option) => {
            const active = gameSystem === option.id;
            return (
              <button
                aria-pressed={active}
                className={`settings-choice${active ? " settings-choice--active" : ""}`}
                key={option.id}
                type="button"
                onClick={() => setGameSystem(option.id)}
              >
                <span>{t(option.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {gameSystem === "GENERIC" ? (
          <p className="settings-preference-note">
            {t("settings.general.system.genericHint")}
          </p>
        ) : null}
      </section>
    </div>
  );
}
