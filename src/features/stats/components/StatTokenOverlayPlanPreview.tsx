import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import {
  createTokenOverlayPlan,
  getOverlayPlanSummary,
} from "../services/statTokenOverlayPlan";
import { createTokenSyncPayload } from "../services/statTokenSync";
import type { StatTrackedToken } from "../statTypes";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
};

function shorten(value: string, max = 28): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function StatTokenOverlayPlanPreview({ token, isGm }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const payload = createTokenSyncPayload(token);
  const plan = createTokenOverlayPlan(payload);

  if (!isGm) return null;

  if (!plan) {
    return (
      <div className="stat-token-overlay-plan-preview">
        <Badge tone="warning">Overlay impossible · non lié Owlbear</Badge>
      </div>
    );
  }

  return (
    <div className="stat-token-overlay-plan-preview" aria-label="Plan overlay Owlbear">
      <div className="stat-token-overlay-plan-preview__header">
        <div className="stat-token-overlay-plan-preview__badges">
          <Badge tone={plan.status === "ready" ? "success" : "default"}>
            {getOverlayPlanSummary(plan)}
          </Badge>
          <Badge>ID overlay : {shorten(plan.overlayId)}</Badge>
          <Badge>
            Layout : {plan.layout.anchor} · {plan.style.variant} · max {plan.layout.maxItems}
          </Badge>
        </div>

        {plan.items.length > 0 ? (
          <Button onClick={() => setDetailsOpen((current) => !current)}>
            Plan overlay
          </Button>
        ) : null}
      </div>

      {detailsOpen ? (
        <div className="stat-token-overlay-plan-preview__details">
          {plan.items.map((item) => (
            <span key={item.id} title={item.title}>
              {item.label} · x{item.x} y{item.y}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
