import { useCallback, useEffect, useMemo, useState } from "react";
import OBR, { type Player } from "@owlbear-rodeo/sdk";
import {
  applyThemeVariables,
  createTgmThemeFromObrTheme,
  fallbackTgmTheme,
} from "../../../core/theme/obrTheme";
import type { StatTrackedToken, StatTrackerInput } from "../statTypes";
import { StatTrackerCard } from "../components/StatTrackerCard";
import { updateEmbeddedStatToken } from "../services/statEmbeddedProfileActions";
import {
  canViewerEditTracker,
  GM_VIEWER,
  type StatPermissionViewer,
} from "../services/statPermissions";
import { isSupportedStatTokenItem } from "../services/statTokenEligibility";
import { createOrUpdateTokenOverlay } from "../services/statTokenOverlayObrSync";
import { readEmbeddedStatToken } from "../services/statTokenSceneLinks";
import { updateTokenTracker } from "../services/statTokens";
import {
  changeTrackerValue,
  toggleTracker,
  updateTracker,
} from "../services/statTrackers";
import "./statTrackerContextMenu.css";

function viewerFromPlayer(player: Player): StatPermissionViewer {
  if (player.role === "PLAYER") {
    return { role: "player", playerId: player.id, playerName: player.name };
  }
  return GM_VIEWER;
}

export function StatTrackerContextMenuApp() {
  const [token, setToken] = useState<StatTrackedToken | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<StatPermissionViewer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const selection = await OBR.player.getSelection();
      const selectedItemId = selection?.length === 1 ? selection[0] : undefined;
      if (!selectedItemId) {
        setItemId(null);
        setToken(null);
        return;
      }

      const [item] = await OBR.scene.items.getItems([selectedItemId]);
      if (!item || !isSupportedStatTokenItem(item)) {
        setItemId(null);
        setToken(null);
        return;
      }

      setItemId(selectedItemId);
      setToken(readEmbeddedStatToken(item) ?? null);
      setError(null);
    } catch {
      setError("Impossible de lire les stats du token sélectionné.");
    }
  }, []);

  useEffect(() => {
    let unsubscribePlayer: (() => void) | undefined;
    let unsubscribeItems: (() => void) | undefined;
    let unsubscribeTheme: (() => void) | undefined;
    let mounted = true;

    document.body.classList.add("stat-tracker-context-host");
    applyThemeVariables(fallbackTgmTheme);

    OBR.onReady(() => {
      if (!mounted) return;

      void OBR.theme
        .getTheme()
        .then((obrTheme) => {
          if (mounted) applyThemeVariables(createTgmThemeFromObrTheme(obrTheme));
        })
        .catch(() => applyThemeVariables(fallbackTgmTheme));

      unsubscribeTheme?.();
      unsubscribeTheme = OBR.theme.onChange((obrTheme) => {
        applyThemeVariables(createTgmThemeFromObrTheme(obrTheme));
      });

      void Promise.all([
        OBR.player.getRole(),
        OBR.player.getId().catch(() => undefined),
        OBR.player.getName().catch(() => undefined),
      ]).then(([role, playerId, playerName]) => {
        if (!mounted) return;
        setViewer(
          role === "GM"
            ? GM_VIEWER
            : { role: "player", playerId, playerName },
        );
      });

      void refresh();
      unsubscribePlayer?.();
      unsubscribeItems?.();
      unsubscribePlayer = OBR.player.onChange((player) => {
        setViewer(viewerFromPlayer(player));
        void refresh();
      });
      unsubscribeItems = OBR.scene.items.onChange(() => void refresh());
    });

    return () => {
      mounted = false;
      document.body.classList.remove("stat-tracker-context-host");
      unsubscribePlayer?.();
      unsubscribeItems?.();
      unsubscribeTheme?.();
    };
  }, [refresh]);

  const visibleTrackers = useMemo(() => {
    if (!token || !viewer) return [];
    if (viewer.role === "gm") return token.trackers;
    return token.trackers.filter((tracker) =>
      canViewerEditTracker(token, tracker, viewer),
    );
  }, [token, viewer]);

  const mutate = useCallback(
    async (update: (current: StatTrackedToken) => StatTrackedToken) => {
      if (!itemId) return;

      setBusy(true);
      setError(null);
      try {
        const updated = await updateEmbeddedStatToken(itemId, update);
        if (!updated) {
          setError("Aucune configuration de stats n’est liée à ce token.");
          return;
        }

        setToken(updated);
        if (viewer?.role === "gm") {
          await createOrUpdateTokenOverlay(updated).catch(() => undefined);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible de modifier les stats du token.",
        );
      } finally {
        setBusy(false);
      }
    },
    [itemId, viewer],
  );

  const mutateTracker = useCallback(
    (
      trackerId: string,
      update: Parameters<typeof updateTokenTracker>[2],
    ) => {
      void mutate((current) => {
        const currentTracker = current.trackers.find((tracker) => tracker.id === trackerId);
        if (!currentTracker) return current;
        if (
          viewer?.role === "player" &&
          !canViewerEditTracker(current, currentTracker, viewer)
        ) {
          return current;
        }
        return updateTokenTracker(current, trackerId, update);
      });
    },
    [mutate, viewer],
  );

  if (!itemId || !viewer) {
    return (
      <main className="stat-tracker-context stat-tracker-context--empty">
        <p>{error ?? "Chargement des stats…"}</p>
      </main>
    );
  }

  if (!token || visibleTrackers.length === 0) {
    return (
      <main className="stat-tracker-context stat-tracker-context--empty">
        <p>
          {error ??
            (viewer.role === "gm"
              ? "Aucun tracker configuré pour ce token."
              : "Aucun tracker modifiable ne vous est attribué sur ce token.")}
        </p>
      </main>
    );
  }

  const updateTrackerInput = (trackerId: string, input: StatTrackerInput) => {
    mutateTracker(trackerId, (tracker) => updateTracker(tracker, input));
  };

  return (
    <main className="stat-tracker-context">
      {error ? <p className="stat-tracker-context__error">{error}</p> : null}

      <div className="stat-tracker-list stat-tracker-context__list">
        {visibleTrackers.map((tracker) => {
          const canEdit =
            !busy &&
            (viewer.role === "gm" || canViewerEditTracker(token, tracker, viewer));

          return (
            <StatTrackerCard
              key={tracker.id}
              canEdit={canEdit}
              /*
               * Le sous-menu Stats est une interface de changement rapide :
               * aucun menu d'administration, même pour le MJ.
               */
              isGm={false}
              token={token}
              tracker={tracker}
              onChangeValue={(delta) => {
                mutateTracker(tracker.id, (currentTracker) =>
                  changeTrackerValue(currentTracker, delta),
                );
              }}
              onRemove={() => undefined}
              onToggle={() => {
                mutateTracker(tracker.id, (currentTracker) =>
                  toggleTracker(currentTracker),
                );
              }}
              onUpdate={(input) => updateTrackerInput(tracker.id, input)}
            />
          );
        })}
      </div>
    </main>
  );
}
