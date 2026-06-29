import { Badge } from "../../../shared/components/Badge";
import {
  getOverlayObrPrepareSummary,
  prepareOverlayImageForObr,
  STAT_OVERLAY_METADATA_KEY,
} from "../services/statTokenOverlayObrAdapter";
import type { StatTrackedToken } from "../statTypes";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
};

function shorten(value: string, max = 28): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function StatTokenObrOverlayPreparePreview({ token, isGm }: Props) {
  if (!isGm) return null;

  const result = prepareOverlayImageForObr(token);
  const preparedImage = result.preparedImage;

  return (
    <div className="stat-token-obr-prepare-preview" aria-label="Diagnostic préparation Owlbear">
      <div className="stat-token-obr-prepare-preview__badges">
        <Badge
          tone={
            result.status === "ready"
              ? "success"
              : result.status === "invalid"
                ? "danger"
                : result.status === "not-linked"
                  ? "warning"
                  : "default"
          }
        >
          {getOverlayObrPrepareSummary(result)}
        </Badge>

        {preparedImage ? (
          <>
            <Badge>
              {preparedImage.width}×{preparedImage.height} · {preparedImage.itemCount} item
              {preparedImage.itemCount > 1 ? "s" : ""}
            </Badge>
            <Badge>Overlay : {shorten(preparedImage.overlayId)}</Badge>
          </>
        ) : result.reason ? (
          <Badge>{result.reason}</Badge>
        ) : null}
      </div>

      {preparedImage ? (
        <p className="stat-token-obr-prepare-preview__meta">
          Metadata future : {STAT_OVERLAY_METADATA_KEY}
        </p>
      ) : null}
    </div>
  );
}
