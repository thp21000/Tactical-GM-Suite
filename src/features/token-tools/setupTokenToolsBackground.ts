import OBR from "@owlbear-rodeo/sdk";
import {
  getTacticalTokenContextKeyFilters,
  isSupportedTacticalTokenItem,
} from "../../core/tokens/tokenEligibility";
import { ensureCoreAssignmentForStatToken } from "./tokenPlayerAssignmentIntegration";
import {
  TOKEN_TOOLS_CONTEXT_MENU_ID,
  TOKEN_TOOLS_POPOVER_ID,
} from "./tokenToolsConstants";

function getTokenToolsUrl(itemId: string): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set("view", "token-tools");
  url.searchParams.set("itemId", itemId);
  return url.href;
}

async function syncCurrentSceneLegacyAssignments(): Promise<void> {
  try {
    if (!(await OBR.scene.isReady())) return;
    if ((await OBR.player.getRole()) !== "GM") return;

    const items = await OBR.scene.items.getItems();
    for (const item of items) {
      if (!isSupportedTacticalTokenItem(item)) continue;
      await ensureCoreAssignmentForStatToken(item).catch(() => undefined);
    }
  } catch {
    // Une migration de compatibilité ne doit jamais bloquer le background.
  }
}

export function setupTokenToolsBackground(): () => void {
  let unsubscribeSceneReady: (() => void) | undefined;

  OBR.onReady(() => {
    const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;

    void OBR.contextMenu.create({
      id: TOKEN_TOOLS_CONTEXT_MENU_ID,
      icons: [
        {
          icon: iconUrl,
          label: "Tactical GM Suite",
          filter: {
            min: 1,
            max: 1,
            roles: ["GM"],
            every: getTacticalTokenContextKeyFilters(),
          },
        },
      ],
      onClick: (context, elementId) => {
        const [item] = context.items;
        if (!item) return;

        void OBR.popover
          .close(TOKEN_TOOLS_POPOVER_ID)
          .catch(() => undefined)
          .finally(() => {
            void OBR.popover.open({
              id: TOKEN_TOOLS_POPOVER_ID,
              url: getTokenToolsUrl(item.id),
              width: 270,
              height: 104,
              anchorElementId: elementId,
              anchorReference: "ELEMENT",
              anchorOrigin: { horizontal: "RIGHT", vertical: "CENTER" },
              transformOrigin: { horizontal: "LEFT", vertical: "CENTER" },
            });
          });
      },
    });

    void syncCurrentSceneLegacyAssignments();
    unsubscribeSceneReady?.();
    unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
      if (ready) void syncCurrentSceneLegacyAssignments();
    });
  });

  return () => {
    unsubscribeSceneReady?.();
    void OBR.contextMenu.remove(TOKEN_TOOLS_CONTEXT_MENU_ID);
    void OBR.popover.close(TOKEN_TOOLS_POPOVER_ID).catch(() => undefined);
  };
}
