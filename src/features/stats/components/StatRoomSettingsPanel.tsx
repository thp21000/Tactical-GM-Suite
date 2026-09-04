import { useI18n } from "../../../i18n";
import { useStatRoomSettings } from "../hooks/useStatRoomSettings";

type Props = {
  enabled: boolean;
};

export function StatRoomSettingsPanel({ enabled }: Props) {
  const { t } = useI18n();
  const roomSettings = useStatRoomSettings(enabled);
  const checked = roomSettings.settings.allowPlayerConditions;

  return (
    <div className="stat-room-settings">
      <div className="stat-room-settings__header">
        <strong>{t("stats.settings.permissions.title")}</strong>
        <span>{t("stats.settings.permissions.summary")}</span>
      </div>

      <label className="stat-room-settings__toggle-row">
        <span className="stat-room-settings__copy">
          <strong>{t("stats.settings.playerConditions.label")}</strong>
          <span>{t("stats.settings.playerConditions.help")}</span>
        </span>

        <input
          checked={checked}
          disabled={!enabled || roomSettings.loading || roomSettings.saving}
          type="checkbox"
          onChange={(event) => {
            void roomSettings
              .setAllowPlayerConditions(event.target.checked)
              .catch(() => undefined);
          }}
        />
        <span className="stat-room-settings__switch" aria-hidden="true">
          <span />
        </span>
      </label>

      {roomSettings.error ? (
        <p className="stat-room-settings__error">{t("stats.settings.error")}</p>
      ) : null}
    </div>
  );
}
