import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { useStatTokenOverlaySync } from "../hooks/useStatTokenOverlaySync";
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
  const displayItemCount = items.public.length + items.private.length + items.gm.length;
  const canCreateOrUpdate = Boolean(token.sourceItemId) && !isLoading;
  const canDelete = Boolean(token.sourceItemId) && !isLoading;

  return (
    <div className="stat-token-obr-prepare-preview" aria-label="Diagnostic préparation Owlbear Stats">
      <div className="stat-token-obr-prepare-preview__badges">
        <Badge tone={displayItemCount > 0 ? "success" : "default"}>
          Affichage Stats : {displayItemCount > 0 ? "ON" : "OFF"}
        </Badge>
        <Badge>
          Trackers · Public {items.public.length} · Privé {items.private.length} · MJ {items.gm.length}
        </Badge>
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
            <Badge>Overlay Stats : {shorten(preparedImage.overlayId)}</Badge>
          </>
        ) : result.reason ? (
          <Badge>{result.reason}</Badge>
        ) : null}
      </div>

      {preparedImage ? (
        <p className="stat-token-obr-prepare-preview__meta">
          Metadata Stats : {STAT_OVERLAY_METADATA_KEY}
        </p>
      ) : null}

      <p className="stat-token-obr-prepare-preview__meta">
        Cet aperçu concerne uniquement les trackers Stats. Les Conditions utilisent leur propre overlay.
      </p>

      <div className="stat-token-obr-prepare-preview__actions">
        <Button onClick={() => void createOrUpdateOverlay(token)} disabled={!canCreateOrUpdate}>
          {loadingAction === "create-or-update"
            ? "Création…"
            : "Créer / MAJ affichage Stats"}
        </Button>
        {token.sourceItemId ? (
          <Button onClick={() => void deleteOverlay(token)} disabled={!canDelete}>
            {loadingAction === "delete"
              ? "Suppression…"
              : "Supprimer affichage Stats"}
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
