import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { useStatTokenOverlaySync } from "../hooks/useStatTokenOverlaySync";
import { getTokenDisplayConditions } from "../services/statConditions";
import {
  getOverlayObrPrepareSummary,
  prepareOverlayImageForObr,
  STAT_OVERLAY_METADATA_KEY,
} from "../services/statTokenOverlayObrAdapter";
import type { StatOverlayObrSyncStatus } from "../services/statTokenOverlayObrSync";
import { getTokenDisplayItemsByVisibility } from "../services/statTokenDisplay";
import type { StatTrackedToken } from "../statTypes";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
};

function shorten(value: string, max = 28): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function getResultTone(status: StatOverlayObrSyncStatus) {
  if (status === "created" || status === "updated" || status === "deleted") {
    return "success";
  }

  if (status === "error") return "danger";
  if (status === "not-ready" || status === "unavailable") return "warning";
  return "default";
}

function getResultLabel(status: StatOverlayObrSyncStatus): string {
  if (status === "created") return "Créé";
  if (status === "updated") return "Mis à jour";
  if (status === "deleted") return "Supprimé";
  if (status === "not-ready") return "Non prêt";
  if (status === "unavailable") return "Indisponible";
  if (status === "not-found") return "Introuvable";
  return "Erreur";
}

export function StatTokenObrOverlayPreparePreview({ token, isGm }: Props) {
  const {
    createOrUpdateOverlay,
    deleteOverlay,
    isLoading,
    loadingAction,
    lastResult,
  } = useStatTokenOverlaySync();

  if (!isGm) return null;

  const result = prepareOverlayImageForObr(token);
  const preparedImage = result.preparedImage;
  const items = getTokenDisplayItemsByVisibility(token);
  const displayedCondition = getTokenDisplayConditions(token)[0];
  const trackerDisplayCount = items.public.length + items.private.length + items.gm.length;
  const displayItemCount = trackerDisplayCount + (displayedCondition ? 1 : 0);
  const canCreateOrUpdate = Boolean(token.sourceItemId) && !isLoading;
  const canDelete = Boolean(token.sourceItemId) && !isLoading;

  return (
    <div className="stat-token-obr-prepare-preview" aria-label="Diagnostic préparation Owlbear">
      <div className="stat-token-obr-prepare-preview__badges">
        <Badge tone={displayItemCount > 0 ? "success" : "default"}>
          Afficher token : {displayItemCount > 0 ? "ON" : "OFF"}
        </Badge>
        <Badge>
          Trackers · Public {items.public.length} · Privé {items.private.length} · MJ {items.gm.length}
        </Badge>
        {displayedCondition ? (
          <Badge tone="success">
            Anneau : {displayedCondition.label} · {displayedCondition.visibility === "gm" ? "MJ" : displayedCondition.visibility === "private" ? "Privé" : "Public"}
          </Badge>
        ) : (
          <Badge>Anneau : aucun</Badge>
        )}
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
          Trackers : {getOverlayObrPrepareSummary(result)}
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
          Metadata : {STAT_OVERLAY_METADATA_KEY}
        </p>
      ) : null}

      <p className="stat-token-obr-prepare-preview__meta">
        Trackers : labels au-dessus · Condition : image centrée attachée au token
      </p>

      <div className="stat-token-obr-prepare-preview__actions">
        <Button onClick={() => void createOrUpdateOverlay(token)} disabled={!canCreateOrUpdate}>
          {loadingAction === "create-or-update"
            ? "Création…"
            : "Créer / MAJ affichage token"}
        </Button>
        {token.sourceItemId ? (
          <Button onClick={() => void deleteOverlay(token)} disabled={!canDelete}>
            {loadingAction === "delete"
              ? "Suppression…"
              : "Supprimer affichage token"}
          </Button>
        ) : null}
      </div>

      {lastResult ? (
        <div className="stat-token-obr-prepare-preview__result">
          <Badge tone={getResultTone(lastResult.status)}>{getResultLabel(lastResult.status)}</Badge>
          <span>{lastResult.message}</span>
        </div>
      ) : null}
    </div>
  );
}
