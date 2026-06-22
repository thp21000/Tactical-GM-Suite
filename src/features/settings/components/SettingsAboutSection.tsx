import { APP_VERSION } from "../../../core/constants/version";

const MANIFEST_URL = "https://thp21000.github.io/Tactical-GM-Suite/manifest.json";

export function SettingsAboutSection() {
  return (
    <dl className="settings-list">
      <div>
        <dt>Application</dt>
        <dd>Tactical GM Suite</dd>
      </div>
      <div>
        <dt>Version</dt>
        <dd>{APP_VERSION}</dd>
      </div>
      <div>
        <dt>Statut</dt>
        <dd>V1 stabilisée / test terrain</dd>
      </div>
      <div>
        <dt>Manifest</dt>
        <dd><a href={MANIFEST_URL}>{MANIFEST_URL}</a></dd>
      </div>
    </dl>
  );
}
