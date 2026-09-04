import { useCallback, useEffect, useMemo, useState } from "react";
import OBR, { type Item, type Player } from "@owlbear-rodeo/sdk";
import { ArrowLeft, Check, ChevronRight, Minus, Plus, UserRound } from "lucide-react";
import {
  applyThemeVariables,
  createTgmThemeFromObrTheme,
  fallbackTgmTheme,
} from "../../core/theme/obrTheme";
import { readTokenPlayerAssignment } from "../../core/tokens/tokenPlayerAssignment";
import { useI18n } from "../../i18n";
import {
  addSceneItemsToStatTracker,
  removeSceneItemsFromStatTracker,
} from "../stats/services/statContextMenuActions";
import {
  isStatTokenTrackedItem,
  readEmbeddedStatToken,
} from "../stats/services/statTokenSceneLinks";
import {
  assignTacticalTokenToPlayer,
  ensureCoreAssignmentForStatToken,
} from "./tokenPlayerAssignmentIntegration";
import "./tokenToolsPopover.css";

type ViewMode = "actions" | "players";

function normalizeRoomPlayers(players: Player[], locale: string): Player[] {
  const byId = new Map<string, Player>();
  for (const player of players) {
    if (player.role !== "PLAYER") continue;
    byId.set(player.id, player);
  }
  return [...byId.values()].sort((left, right) =>
    left.name.localeCompare(right.name, locale, { sensitivity: "base" }),
  );
}

export function TokenToolsPopoverApp() {
  const { language, t } = useI18n();
  const queryItemId = new URLSearchParams(window.location.search).get("itemId");
  const [item, setItem] = useState<Item | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<ViewMode>("actions");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshItem = useCallback(async () => {
    try {
      const selection = queryItemId ? undefined : await OBR.player.getSelection();
      const targetItemId =
        queryItemId ?? (selection?.length === 1 ? selection[0] : undefined);

      if (!targetItemId) {
        setItem(null);
        setError(t("tokenTools.error.token"));
        return;
      }

      let [nextItem] = await OBR.scene.items.getItems([targetItemId]);
      if (!nextItem) {
        setItem(null);
        setError(t("tokenTools.error.token"));
        return;
      }

      // Migration douce de l'ancien lien Stats vers la métadonnée Core.
      if (!readTokenPlayerAssignment(nextItem) && readEmbeddedStatToken(nextItem)) {
        await ensureCoreAssignmentForStatToken(nextItem);
        [nextItem] = await OBR.scene.items.getItems([targetItemId]);
      }

      if (!nextItem) {
        setItem(null);
        setError(t("tokenTools.error.token"));
        return;
      }
      setItem(nextItem);
      setError(null);
    } catch {
      setError(t("tokenTools.error.token"));
    }
  }, [queryItemId, t]);

  useEffect(() => {
    let mounted = true;
    let unsubscribeParty: (() => void) | undefined;
    let unsubscribePlayer: (() => void) | undefined;
    let unsubscribeTheme: (() => void) | undefined;

    document.body.classList.add("token-tools-host");
    applyThemeVariables(fallbackTgmTheme);

    OBR.onReady(() => {
      if (!mounted) return;
      void OBR.theme
        .getTheme()
        .then((theme) => {
          if (mounted) applyThemeVariables(createTgmThemeFromObrTheme(theme));
        })
        .catch(() => applyThemeVariables(fallbackTgmTheme));
      unsubscribeTheme = OBR.theme.onChange((theme) => {
        applyThemeVariables(createTgmThemeFromObrTheme(theme));
      });

      void refreshItem();
      void OBR.party
        .getPlayers()
        .then((roomPlayers) => {
          if (mounted) setPlayers(normalizeRoomPlayers(roomPlayers, language));
        })
        .catch(() => {
          if (mounted) setPlayers([]);
        });

      // Le ContextMenuEmbed n'a pas besoin de relire le token pour chaque
      // changement de la scène. Les deux actions du menu rafraîchissent déjà
      // explicitement l'item après leur écriture. Éviter ce listener global
      // empêche les overlays Stats/Conditions et les autres changements OBR de
      // provoquer des rerenders permanents du sous-menu.
      unsubscribePlayer = OBR.player.onChange(() => {
        if (!queryItemId) void refreshItem();
      });
      unsubscribeParty = OBR.party.onChange((roomPlayers) => {
        if (mounted) setPlayers(normalizeRoomPlayers(roomPlayers, language));
      });
    });

    return () => {
      mounted = false;
      document.body.classList.remove("token-tools-host");
      unsubscribeParty?.();
      unsubscribePlayer?.();
      unsubscribeTheme?.();
    };
  }, [language, queryItemId, refreshItem]);

  const assignment = item ? readTokenPlayerAssignment(item) : undefined;
  const tracked = item ? isStatTokenTrackedItem(item) : false;
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === assignment?.playerId),
    [assignment?.playerId, players],
  );
  const assignmentName = assignment?.playerId
    ? assignment.playerName ?? selectedPlayer?.name ?? assignment.playerId
    : undefined;

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await action();
        await refreshItem();
      } catch {
        setError(t("tokenTools.error.update"));
      } finally {
        setBusy(false);
      }
    },
    [refreshItem, t],
  );

  if (!item) {
    return (
      <main className="token-tools token-tools--empty">
        <p>{error ?? t("tokenTools.loading")}</p>
      </main>
    );
  }

  if (mode === "players") {
    const currentIsOffline = Boolean(
      assignment?.playerId &&
        !players.some((player) => player.id === assignment.playerId),
    );

    return (
      <main className="token-tools">
        <button
          className="token-tools__back"
          type="button"
          onClick={() => setMode("actions")}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{t("tokenTools.back")}</span>
        </button>

        <div className="token-tools__list token-tools__list--players">
          <button
            className="token-tools__row"
            disabled={busy}
            type="button"
            onClick={() =>
              void run(async () => {
                await assignTacticalTokenToPlayer(item.id);
                setMode("actions");
              })
            }
          >
            <UserRound size={16} aria-hidden="true" />
            <span>{t("tokenTools.assignment.none")}</span>
            {!assignment?.playerId ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <span />
            )}
          </button>

          {currentIsOffline ? (
            <div className="token-tools__row is-muted" aria-disabled="true">
              <UserRound size={16} aria-hidden="true" />
              <span>
                {t("tokenTools.assignment.offline", {
                  name: assignmentName ?? assignment?.playerId ?? "—",
                })}
              </span>
              <Check size={15} aria-hidden="true" />
            </div>
          ) : null}

          {players.map((player) => (
            <button
              className="token-tools__row"
              disabled={busy}
              key={player.id}
              type="button"
              onClick={() =>
                void run(async () => {
                  await assignTacticalTokenToPlayer(item.id, player);
                  setMode("actions");
                })
              }
            >
              <UserRound size={16} aria-hidden="true" />
              <span>{player.name}</span>
              {assignment?.playerId === player.id ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <span />
              )}
            </button>
          ))}

          {players.length === 0 && !currentIsOffline ? (
            <p className="token-tools__empty-note">
              {t("tokenTools.assignment.noPlayers")}
            </p>
          ) : null}
        </div>
        {error ? <p className="token-tools__error">{error}</p> : null}
      </main>
    );
  }

  return (
    <main className="token-tools">
      <div className="token-tools__list">
        <button
          className="token-tools__row"
          disabled={busy}
          type="button"
          onClick={() =>
            void run(async () => {
              if (tracked) {
                await removeSceneItemsFromStatTracker([item]);
              } else {
                await addSceneItemsToStatTracker([item]);
              }
            })
          }
        >
          {tracked ? (
            <Minus size={16} aria-hidden="true" />
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
          <span>
            {t(tracked ? "tokenTools.stat.remove" : "tokenTools.stat.add")}
          </span>
          <span />
        </button>

        <button
          className="token-tools__row"
          disabled={busy}
          type="button"
          onClick={() => setMode("players")}
        >
          <UserRound size={16} aria-hidden="true" />
          <span>
            {assignmentName
              ? t("tokenTools.assignment.linked", { name: assignmentName })
              : t("tokenTools.assignment.none")}
          </span>
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
      {error ? <p className="token-tools__error">{error}</p> : null}
    </main>
  );
}
