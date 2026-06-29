import { Badge } from "../../../shared/components/Badge";
import { createTokenOverlayPlan } from "../services/statTokenOverlayPlan";
import { renderOverlayPlanToSvg } from "../services/statTokenOverlaySvg";
import { createTokenSyncPayload } from "../services/statTokenSync";
import type { StatTrackedToken } from "../statTypes";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
};

export function StatTokenOverlaySvgPreview({ token, isGm }: Props) {
  if (!isGm) return null;

  const payload = createTokenSyncPayload(token);
  const plan = createTokenOverlayPlan(payload);

  if (!plan) {
    return (
      <div className="stat-token-overlay-svg-preview">
        <Badge tone="warning">Rendu impossible · non lié Owlbear</Badge>
      </div>
    );
  }

  const result = renderOverlayPlanToSvg(plan);

  return (
    <div className="stat-token-overlay-svg-preview" aria-label="Rendu SVG local">
      <div className="stat-token-overlay-svg-preview__header">
        <Badge>Rendu SVG local</Badge>
        <span>
          {result.width}×{result.height} · {result.itemCount} item
          {result.itemCount > 1 ? "s" : ""}
        </span>
      </div>

      <img
        alt={`Rendu SVG local pour ${token.name}`}
        className="stat-token-overlay-svg-preview__image"
        src={result.dataUrl}
      />
    </div>
  );
}
