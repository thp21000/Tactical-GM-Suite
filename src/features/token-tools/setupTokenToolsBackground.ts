import OBR, { type Item } from "@owlbear-rodeo/sdk";
import {
  getTacticalTokenContextKeyFilters,
  isSupportedTacticalTokenItem,
} from "../../core/tokens/tokenEligibility";
import { ensureCoreAssignmentForStatToken } from "./tokenPlayerAssignmentIntegration";
import { TOKEN_TOOLS_CONTEXT_MENU_ID } from "./tokenToolsConstants";

function getTokenToolsUrl(): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set("view", "token-tools");
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
      embed: {
        url: getTokenToolsUrl(),
        height: 220,
      },
      onClick: () => undefined,
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
  };
}
