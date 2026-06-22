import { useEffect } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import { INITIATIVE_CONTEXT_MENU_ID } from "../initiativeConstants";

type UseInitiativeContextMenuOptions = {
  isReady: boolean;
  onAddItems: (items: Item[]) => void;
};

export function useInitiativeContextMenu({
  isReady,
  onAddItems,
}: UseInitiativeContextMenuOptions): void {
  useEffect(() => {
    if (!isReady || !isObrReady()) {
      return undefined;
    }

    void OBR.contextMenu.create({
      id: INITIATIVE_CONTEXT_MENU_ID,
      icons: [
        {
          icon: "/icon.svg",
          label: "Add to Initiative",
          filter: { min: 1 },
        },
      ],
      onClick: (context) => {
        onAddItems(context.items);
      },
    });

    return () => {
      void OBR.contextMenu.remove(INITIATIVE_CONTEXT_MENU_ID);
    };
  }, [isReady, onAddItems]);
}
