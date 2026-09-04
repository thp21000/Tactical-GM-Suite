import OBR from "@owlbear-rodeo/sdk";
import { getTacticalTokenContextKeyFilters } from "../../core/tokens/tokenEligibility";
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

export function setupTokenToolsBackground(): () => void {
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
  });

  return () => {
    void OBR.contextMenu.remove(TOKEN_TOOLS_CONTEXT_MENU_ID);
    void OBR.popover.close(TOKEN_TOOLS_POPOVER_ID).catch(() => undefined);
  };
}
