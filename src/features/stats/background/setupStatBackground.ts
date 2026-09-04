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

export function setupStatBackground(): () => void {
  let unsubscribeSceneReady: (() => void) | undefined;
  let unsubscribeInitiativeSync: (() => void) | undefined;
  let unsubscribeConditionOverlaySync: (() => void) | undefined;

  OBR.onReady(() => {
    // Start warming the PNG cache immediately, but never delay menu registration.
    void preloadStatPngAssets();

    const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;
    const conditionIconUrl = `${import.meta.env.BASE_URL}condition.svg`;
    const tokenFilters = getStatTokenContextKeyFilters();

    // Ajouter/Retirer du Stat Tracker vit désormais dans le menu Tactical GM Suite.
    void registerStatsQuickContextMenu(iconUrl, tokenFilters).catch(() => undefined);

    void OBR.contextMenu.create({
      id: STAT_CONDITION_CONTEXT_MENU_ID,
      icons: [
        {
          icon: conditionIconUrl,
          label: "Conditions",
          filter: {
            min: 1,
            max: 1,
            roles: ["GM"],
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
    void OBR.contextMenu.remove(STAT_STATS_CONTEXT_MENU_ID);
    void OBR.contextMenu.remove(STAT_CONDITION_CONTEXT_MENU_ID);
  };
}
