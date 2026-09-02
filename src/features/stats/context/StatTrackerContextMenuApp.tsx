import { useCallback, useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import {
  applyThemeVariables,
  createTgmThemeFromObrTheme,
  fallbackTgmTheme,
} from "../../../core/theme/obrTheme";
import type { StatTrackedToken, StatTrackerInput } from "../statTypes";
import { StatTrackerCard } from "../components/StatTrackerCard";
import { updateEmbeddedStatToken } from "../services/statEmbeddedProfileActions";
import { isSupportedStatTokenItem } from "../services/statTokenEligibility";
import { createOrUpdateTokenOverlay } from "../services/statTokenOverlayObrSync";
import { readEmbeddedStatToken } from "../services/statTokenSceneLinks";
import {
  removeTrackerFromToken,
  updateTokenTracker,
} from "../services/statTokens";
import {
  changeTrackerValue,
  toggleTracker,
  updateTracker,
} from "../services/statTrackers";
import "./statTrackerContextMenu.css";

export function StatTrackerContextMenuApp() {
  const [token, setToken] = useState<StatTrackedToken | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
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

      void refresh();
      unsubscribePlayer?.();
      unsubscribeItems?.();
      unsubscribePlayer = OBR.player.onChange(() => void refresh());
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
        await createOrUpdateTokenOverlay(updated).catch(() => undefined);
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
    [itemId],
  );

  if (!itemId) {
    return (
      <main className="stat-tracker-context stat-tracker-context--empty">
        <p>{error ?? "Sélectionnez un token."}</p>
      </main>
    );
  }

  if (!token || token.trackers.length === 0) {
    return (
      <main className="stat-tracker-context stat-tracker-context--empty">
        <p>{error ?? "Aucun tracker configuré pour ce token."}</p>
      </main>
    );
  }

  const updateTrackerInput = (trackerId: string, input: StatTrackerInput) => {
    void mutate((current) =>
      updateTokenTracker(current, trackerId, (tracker) => updateTracker(tracker, input)),
    );
  };

  return (
    <main className="stat-tracker-context">
      {error ? <p className="stat-tracker-context__error">{error}</p> : null}

      <div className="stat-tracker-list stat-tracker-context__list">
        {token.trackers.map((tracker) => (
          <StatTrackerCard
            key={tracker.id}
            canEdit={!busy}
            isGm
            token={token}
            tracker={tracker}
            onChangeValue={(delta) => {
              void mutate((current) =>
                updateTokenTracker(current, tracker.id, (currentTracker) =>
                  changeTrackerValue(currentTracker, delta),
                ),
              );
            }}
            onRemove={() => {
              void mutate((current) => removeTrackerFromToken(current, tracker.id));
            }}
            onToggle={() => {
              void mutate((current) =>
                updateTokenTracker(current, tracker.id, (currentTracker) =>
                  toggleTracker(currentTracker),
                ),
              );
            }}
            onUpdate={(input) => updateTrackerInput(tracker.id, input)}
          />
        ))}
      </div>
    </main>
  );
}
