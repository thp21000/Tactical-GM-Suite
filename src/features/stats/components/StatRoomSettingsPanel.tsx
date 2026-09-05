import { useI18n } from "../../../i18n";
import { useStatRoomSettings } from "../hooks/useStatRoomSettings";
import type { StatTokenDockPosition } from "../services/statRoomSettings";

type Props = {
  enabled: boolean;
};

export function StatRoomSettingsPanel({ enabled }: Props) {
  const { t } = useI18n();
  const roomSettings = useStatRoomSettings(enabled);
  const checked = roomSettings.settings.allowPlayerConditions;
  const disabled = !enabled || roomSettings.loading || roomSettings.saving;

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
          disabled={disabled}
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

      <label className="stat-room-settings__toggle-row">
        <span className="stat-room-settings__copy">
          <strong>{t("stats.settings.tokenDock.label")}</strong>
          <span>{t("stats.settings.tokenDock.help")}</span>
        </span>
        <select
          aria-label={t("stats.settings.tokenDock.label")}
          disabled={disabled}
          value={roomSettings.settings.tokenStatsPosition}
          onChange={(event) => {
            const position = event.target.value as StatTokenDockPosition;
            void roomSettings.setTokenStatsPosition(position).catch(() => undefined);
          }}
        >
          <option value="top">{t("stats.settings.tokenDock.top")}</option>
          <option value="bottom">{t("stats.settings.tokenDock.bottom")}</option>
        </select>
      </label>

      {roomSettings.error ? (
        <p className="stat-room-settings__error">{t("stats.settings.error")}</p>
      ) : null}
    </div>
  );
}
