import { APP_VERSION } from "../../../core/constants/version";
import type { ObrReadyState } from "../../../core/obr/obrReady";
import { Badge } from "../../../shared/components/Badge";

const MANIFEST_URL = "https://thp21000.github.io/Tactical-GM-Suite/manifest.json";

type SettingsAboutSectionProps = {
  obr: ObrReadyState;
};

function getObrLabel(obr: ObrReadyState): string {
  if (!obr.isAvailable) {
    return "Mode local";
  }

  return obr.isReady ? "Owlbear prêt" : "Owlbear non prêt";
}

export function SettingsAboutSection({ obr }: SettingsAboutSectionProps) {
  return (
    <div className="settings-about stack">
      <p className="muted">Suite modulaire pour MJ sur Owlbear Rodeo.</p>
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
          <dt>État Owlbear</dt>
          <dd>
            <Badge tone={obr.isReady ? "success" : "warning"}>{getObrLabel(obr)}</Badge>
          </dd>
        </div>
        <div>
          <dt>Manifest</dt>
          <dd><a href={MANIFEST_URL}>{MANIFEST_URL}</a></dd>
        </div>
      </dl>
    </div>
  );
}
