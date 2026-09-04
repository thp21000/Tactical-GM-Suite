import OBR, { type Item } from "@owlbear-rodeo/sdk";
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

async function syncAssignmentsForItems(items: Item[]): Promise<void> {
  try {
    if ((await OBR.player.getRole()) !== "GM") return;

    for (const item of items) {
      if (!isSupportedTacticalTokenItem(item)) continue;
      await ensureCoreAssignmentForStatToken(item).catch(() => undefined);
    }
  } catch {
    // L'assignation transversale ne doit jamais bloquer le background Owlbear.
  }
}

async function syncCurrentSceneAssignments(): Promise<void> {
  try {
    if (!(await OBR.scene.isReady())) return;
    await syncAssignmentsForItems(await OBR.scene.items.getItems());
  } catch {
    // Une scène en transition sera resynchronisée au prochain événement ready/items.
  }
}

export function setupTokenToolsBackground(): () => void {
  let unsubscribeSceneReady: (() => void) | undefined;
  let unsubscribeItems: (() => void) | undefined;

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

    void syncCurrentSceneAssignments();

    unsubscribeItems?.();
    unsubscribeItems = OBR.scene.items.onChange((items) => {
      void syncAssignmentsForItems(items);
    });

    unsubscribeSceneReady?.();
    unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
      if (ready) void syncCurrentSceneAssignments();
    });
  });

  return () => {
    unsubscribeItems?.();
    unsubscribeSceneReady?.();
    void OBR.contextMenu.remove(TOKEN_TOOLS_CONTEXT_MENU_ID);
    void OBR.popover.close(TOKEN_TOOLS_POPOVER_ID).catch(() => undefined);
  };
}
