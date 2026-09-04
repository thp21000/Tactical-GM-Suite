import OBR from "@owlbear-rodeo/sdk";
import { TOKEN_PLAYER_ASSIGNMENT_METADATA_KEY } from "../../../core/tokens/tokenPlayerAssignment";
import {
  STAT_CONDITION_CONTEXT_MENU_ID,
  STAT_STATS_CONTEXT_MENU_ID,
} from "../statConstants";
import { preloadStatPngAssets } from "../services/statAssetPreload";
import { setupStatConditionInitiativeSync } from "../services/statConditionInitiativeSync";
import { setupStatConditionOverlayAutoSync } from "../services/statConditionOverlayAutoSync";
import { createOrUpdateTokenConditionOverlay } from "../services/statConditionOverlayObrSync";
import { createEmbeddedStatTokenMetadata } from "../services/statEmbeddedProfileActions";
import {
  getStatRoomSettings,
  subscribeToStatRoomSettings,
} from "../services/statRoomSettings";
import { getStatTokenContextKeyFilters } from "../services/statTokenEligibility";
import {
  hasPlayerEditableTrackers,
  readEmbeddedStatToken,
  readStatTokenLinkMetadata,
  STAT_TOKEN_LINK_METADATA_KEY,
} from "../services/statTokenSceneLinks";

function getExtensionUrl(view: string): string {
  return new URL(
    `${import.meta.env.BASE_URL}?view=${encodeURIComponent(view)}`,
    window.location.origin,
  ).href;
}

async function syncCurrentSceneConditionBadges(): Promise<void> {
  try {
    if (!(await OBR.scene.isReady())) return;
    if ((await OBR.player.getRole()) !== "GM") return;

    const items = await OBR.scene.items.getItems();
    for (const item of items) {
      const token = readEmbeddedStatToken(item);
      if (!token) continue;
      await createOrUpdateTokenConditionOverlay(token).catch(() => undefined);
    }
  } catch {
    // Le background ne doit jamais bloquer Owlbear si une scène est en transition.
  }
}

/**
 * Les filtres du Context Menu ne savent pas parcourir le tableau de trackers.
 * Stats conserve donc uniquement le résumé indexable playerEditable.
 * L'assignation joueur est désormais une métadonnée Core séparée.
 */
async function syncCurrentScenePlayerEditMetadata(): Promise<void> {
  try {
    if (!(await OBR.scene.isReady())) return;
    if ((await OBR.player.getRole()) !== "GM") return;

    const items = await OBR.scene.items.getItems();
    const targets = items.filter((item) => {
      const token = readEmbeddedStatToken(item);
      if (!token) return false;
      const link = readStatTokenLinkMetadata(item);
      return link?.playerEditable !== hasPlayerEditableTrackers(token);
    });

    if (targets.length === 0) return;

    await OBR.scene.items.updateItems(targets, (drafts) => {
      for (const draft of drafts) {
        const token = readEmbeddedStatToken(draft);
        if (!token) continue;
        draft.metadata[STAT_TOKEN_LINK_METADATA_KEY] = createEmbeddedStatTokenMetadata(
          token,
          token.isTracked !== false,
        );
      }
    });
  } catch {
    // La synchronisation des résumés ne doit jamais empêcher le reste du background.
  }
}

async function registerStatsQuickContextMenu(
  iconUrl: string,
  tokenFilters: ReturnType<typeof getStatTokenContextKeyFilters>,
): Promise<void> {
  const role = await OBR.player.getRole();

  if (role === "GM") {
    await OBR.contextMenu.create({
      id: STAT_STATS_CONTEXT_MENU_ID,
      icons: [
        {
          icon: iconUrl,
          label: "Stats",
          filter: {
            min: 1,
            max: 1,
            roles: ["GM"],
            every: tokenFilters,
          },
        },
      ],
      embed: {
        url: getExtensionUrl("stats-trackers"),
        height: 500,
      },
      onClick: () => undefined,
    });
    return;
  }

  const playerId = await OBR.player.getId();
  if (!playerId) return;

  await OBR.contextMenu.create({
    id: STAT_STATS_CONTEXT_MENU_ID,
    icons: [
      {
        icon: iconUrl,
        label: "Stats",
        filter: {
          min: 1,
          max: 1,
          roles: ["PLAYER"],
          every: [
            ...tokenFilters,
            {
              key: ["metadata", STAT_TOKEN_LINK_METADATA_KEY, "playerEditable"],
              value: true,
            },
            {
              key: ["metadata", TOKEN_PLAYER_ASSIGNMENT_METADATA_KEY, "playerId"],
              value: playerId,
            },
          ],
        },
      },
    ],
    embed: {
      url: getExtensionUrl("stats-trackers"),
      height: 500,
    },
    onClick: () => undefined,
  });
}

/**
 * Enregistre le menu Conditions uniquement lorsque son état d'accès change.
 *
 * `OBR.room.onMetadataChange` est global à toute la room : Initiative et d'autres
 * modules peuvent donc le déclencher très souvent. Supprimer/recréer un Context
 * Menu à chaque événement force Owlbear à reconstruire le menu clic droit et
 * fait clignoter les `ContextMenuEmbed` voisins. La signature évite toute écriture
 * Context Menu tant que rôle + autorisation restent identiques.
 */
async function syncConditionContextMenu(
  conditionIconUrl: string,
  tokenFilters: ReturnType<typeof getStatTokenContextKeyFilters>,
  previousSignature: string | undefined,
): Promise<string> {
  const [role, roomSettings] = await Promise.all([
    OBR.player.getRole(),
    getStatRoomSettings(),
  ]);
  const allowed = role === "GM" || roomSettings.allowPlayerConditions;
  const signature = `${role}:${allowed ? "allowed" : "blocked"}`;

  if (signature === previousSignature) return signature;

  await OBR.contextMenu.remove(STAT_CONDITION_CONTEXT_MENU_ID).catch(() => undefined);
  if (!allowed) return signature;

  await OBR.contextMenu.create({
    id: STAT_CONDITION_CONTEXT_MENU_ID,
    icons: [
      {
        icon: conditionIconUrl,
        label: "Conditions",
        filter: {
          min: 1,
          max: 1,
          roles: [role],
          every: tokenFilters,
        },
      },
    ],
    embed: {
      url: getExtensionUrl("stats-conditions"),
      height: 500,
    },
    onClick: () => undefined,
  });

  return signature;
}

export function setupStatBackground(): () => void {
  let unsubscribeSceneReady: (() => void) | undefined;
  let unsubscribeInitiativeSync: (() => void) | undefined;
  let unsubscribeConditionOverlaySync: (() => void) | undefined;
  let unsubscribeRoomSettings: (() => void) | undefined;
  let conditionMenuSignature: string | undefined;
  let conditionMenuSyncQueue: Promise<void> = Promise.resolve();

  OBR.onReady(() => {
    // Start warming the PNG cache immediately, but never delay menu registration.
    void preloadStatPngAssets();

    const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;
    const conditionIconUrl = `${import.meta.env.BASE_URL}condition.svg`;
    const tokenFilters = getStatTokenContextKeyFilters();

    const requestConditionMenuSync = () => {
      conditionMenuSyncQueue = conditionMenuSyncQueue
        .then(async () => {
          conditionMenuSignature = await syncConditionContextMenu(
            conditionIconUrl,
            tokenFilters,
            conditionMenuSignature,
          );
        })
        .catch(() => undefined);
    };

    // Ajouter/Retirer du Stat Tracker vit désormais dans le menu Tactical GM Suite.
    void registerStatsQuickContextMenu(iconUrl, tokenFilters).catch(() => undefined);
    requestConditionMenuSync();

    unsubscribeRoomSettings?.();
    unsubscribeRoomSettings = subscribeToStatRoomSettings(() => {
      requestConditionMenuSync();
    });

    void syncCurrentSceneConditionBadges();
    void syncCurrentScenePlayerEditMetadata();

    unsubscribeInitiativeSync?.();
    unsubscribeInitiativeSync = setupStatConditionInitiativeSync();

    unsubscribeConditionOverlaySync?.();
    unsubscribeConditionOverlaySync = setupStatConditionOverlayAutoSync();

    unsubscribeSceneReady?.();
    unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
      if (!ready) return;
      void syncCurrentSceneConditionBadges();
      void syncCurrentScenePlayerEditMetadata();
    });
  });

  return () => {
    unsubscribeSceneReady?.();
    unsubscribeInitiativeSync?.();
    unsubscribeConditionOverlaySync?.();
    unsubscribeRoomSettings?.();
    conditionMenuSignature = undefined;
    void OBR.contextMenu.remove(STAT_STATS_CONTEXT_MENU_ID);
    void OBR.contextMenu.remove(STAT_CONDITION_CONTEXT_MENU_ID);
  };
}
