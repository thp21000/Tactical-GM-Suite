import { useMemo } from "react";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "../../shared/components/Badge";
import { Panel } from "../../shared/components/Panel";
import { StatSummaryPanel } from "./components/StatSummaryPanel";
import { useStatPermissionViewer } from "./hooks/useStatPermissionViewer";
import { useStatSceneTokenBindings } from "./hooks/useStatSceneTokenBindings";
import { useStatTokenOverlayAutoSync } from "./hooks/useStatTokenOverlayAutoSync";
import { useStatTrackerState } from "./hooks/useStatTrackerState";
import { filterTokensForViewer } from "./services/statPermissions";
import { getTokenDisplayItems } from "./services/statTokenDisplay";
import type { StatTrackedToken } from "./statTypes";

type Props = {
  obr: ObrReadyState;
};

export function StatDashboardOverview({ obr }: Props) {
  const stats = useStatTrackerState(obr.isReady);
  const { isGm, viewer, viewerLabel } = useStatPermissionViewer(obr.isReady);

  const sceneBindings = useStatSceneTokenBindings({
    enabled: obr.isReady,
    isGm,
    tokens: stats.tokens,
  });

  const sceneTokensByCanonicalId = useMemo(() => {
    const result = new Map<string, StatTrackedToken[]>();
    for (const token of sceneBindings.sceneTokens) {
      const existing = result.get(token.id) ?? [];
      existing.push(token);
      result.set(token.id, existing);
    }
    return result;
  }, [sceneBindings.sceneTokens]);

  const visibleDisplayGroups = useMemo(
    () =>
      stats.displayGroups
        .map((group) => ({
          ...group,
          tokens: filterTokensForViewer(
            group.tokens.flatMap(
              (token) => sceneTokensByCanonicalId.get(token.id) ?? [],
            ),
            viewer,
          ),
        }))
        .filter((group) => group.tokens.length > 0),
    [sceneTokensByCanonicalId, stats.displayGroups, viewer],
  );

  const sceneSummary = useMemo(() => {
    const tokens = visibleDisplayGroups.flatMap((group) => group.tokens);
    return {
      tokenCount: tokens.length,
      trackerCount: tokens.reduce(
        (total, token) => total + token.trackers.length,
        0,
      ),
      groupCount: visibleDisplayGroups.filter((group) => group.isGroup).length,
      visibleOnTokenCount: tokens.reduce(
        (total, token) => total + getTokenDisplayItems(token).length,
        0,
      ),
    };
  }, [visibleDisplayGroups]);

  const overlayAutoSync = useStatTokenOverlayAutoSync({
    enabled: obr.isReady && sceneBindings.sceneReady && isGm,
    tokens: sceneBindings.sceneTokens,
  });

  return (
    <div className="stack stat-dashboard-overview">
      <Panel>
        <div className="stat-header">
          <div>
            <p className="eyebrow">Tokens suivis</p>
            <h2>Stat Tracker</h2>
            <p>
              Trackers personnalisables attachés aux tokens Owlbear ou ajoutés
              manuellement.
            </p>
          </div>

          <div className="stat-header__badges">
            <Badge tone={obr.isReady ? "success" : "warning"}>
              {obr.modeLabel}
            </Badge>
            <Badge>{viewerLabel}</Badge>
            {obr.isReady ? (
              <Badge tone={sceneBindings.sceneReady ? "success" : "warning"}>
                {sceneBindings.sceneReady
                  ? `Scène : ${sceneBindings.sceneTokens.length} token${sceneBindings.sceneTokens.length > 1 ? "s" : ""}`
                  : "Scène en chargement…"}
              </Badge>
            ) : null}
            {isGm && obr.isReady && sceneBindings.sceneReady ? (
              <Badge
                tone={
                  overlayAutoSync.lastError
                    ? "warning"
                    : overlayAutoSync.isSyncing
                      ? "warning"
                      : "success"
                }
              >
                {overlayAutoSync.lastError
                  ? "Affichage auto : erreur"
                  : overlayAutoSync.isSyncing
                    ? "Affichage auto : MAJ…"
                    : "Affichage token : auto"}
              </Badge>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel>
        <StatSummaryPanel {...sceneSummary} />
      </Panel>
    </div>
  );
}
