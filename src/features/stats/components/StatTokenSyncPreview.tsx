import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import {
  createTokenSyncPayload,
  getTokenSyncSummary,
} from "../services/statTokenSync";
import type { StatTrackedToken } from "../statTypes";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
};

function getShortSourceItemId(sourceItemId: string | undefined): string | null {
  if (!sourceItemId) return null;
  return sourceItemId.length > 12 ? `${sourceItemId.slice(0, 12)}…` : sourceItemId;
}

export function StatTokenSyncPreview({ token, isGm }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const payload = createTokenSyncPayload(token);
  const shortSourceItemId = getShortSourceItemId(payload.sourceItemId);

  if (!isGm) return null;

  return (
    <div className="stat-token-sync-preview" aria-label="Aperçu technique sync Owlbear">
      <div className="stat-token-sync-preview__header">
        <div className="stat-token-sync-preview__badges">
          <Badge
            tone={
              payload.status === "ready"
                ? "success"
                : payload.status === "not-linked"
                  ? "warning"
                  : "default"
            }
          >
            {getTokenSyncSummary(payload)}
          </Badge>
          {shortSourceItemId ? <Badge>Owlbear : {shortSourceItemId}</Badge> : null}
        </div>

        {payload.items.length > 0 ? (
          <Button onClick={() => setDetailsOpen((current) => !current)}>
            Détails sync
          </Button>
        ) : null}
      </div>

      {detailsOpen ? (
        <div className="stat-token-sync-preview__details">
          {payload.items.map((item) => (
            <span key={item.id} title={item.title}>
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
