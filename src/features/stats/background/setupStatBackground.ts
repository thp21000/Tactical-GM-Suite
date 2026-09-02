import OBR from "@owlbear-rodeo/sdk";
import {
  STAT_CONDITION_CONTEXT_MENU_ID,
  STAT_TRACKER_CONTEXT_MENU_ID,
} from "../statConstants";
import {
  addSceneItemsToStatTracker,
  removeSceneItemsFromStatTracker,
} from "../services/statContextMenuActions";
import { createOrUpdateTokenConditionOverlay } from "../services/statConditionOverlayObrSync";
import {
  isStatTokenTrackedItem,
  readEmbeddedStatToken,
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

export function setupStatBackground(): () => void {
  let unsubscribeSceneReady: (() => void) | undefined;

  OBR.onReady(() => {
    const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;
    const conditionIconUrl = `${import.meta.env.BASE_URL}condition.svg`;

    void OBR.contextMenu.create({
      id: STAT_TRACKER_CONTEXT_MENU_ID,
      icons: [
        {
          icon: iconUrl,
          label: "Ajouter au Stat Tracker",
          filter: {
            min: 1,
            every: [
              {
                key: ["metadata", STAT_TOKEN_LINK_METADATA_KEY, "tracked"],
                value: true,
                operator: "!=",
              },
            ],
          },
        },
        {
          icon: iconUrl,
          label: "Retirer du Stat Tracker",
          filter: {
            min: 1,
            every: [
              {
                key: ["metadata", STAT_TOKEN_LINK_METADATA_KEY, "tracked"],
                value: true,
              },
            ],
          },
        },
      ],
      onClick: (menuContext) => {
        if (menuContext.items.every(isStatTokenTrackedItem)) {
          void removeSceneItemsFromStatTracker(menuContext.items);
        } else {
          void addSceneItemsToStatTracker(menuContext.items);
        }
      },
    });

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

    unsubscribeSceneReady?.();
    unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
      if (ready) void syncCurrentSceneConditionBadges();
    });
  });

  return () => {
    unsubscribeSceneReady?.();
    void OBR.contextMenu.remove(STAT_TRACKER_CONTEXT_MENU_ID);
    void OBR.contextMenu.remove(STAT_CONDITION_CONTEXT_MENU_ID);
  };
}
