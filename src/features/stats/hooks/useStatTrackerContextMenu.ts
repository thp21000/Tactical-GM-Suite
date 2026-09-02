import { useEffect } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import { STAT_TRACKER_CONTEXT_MENU_ID } from "../statConstants";
import {
  isStatTokenTrackedItem,
  STAT_TOKEN_LINK_METADATA_KEY,
} from "../services/statTokenSceneLinks";

type Options = {
  isReady: boolean;
  onAddItems: (items: Item[]) => void;
  onRemoveItems: (items: Item[]) => void;
};

export function useStatTrackerContextMenu({
  isReady,
  onAddItems,
  onRemoveItems,
}: Options): void {
  useEffect(() => {
    if (!isReady || !isObrReady()) return undefined;

    const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;

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
          onRemoveItems(menuContext.items);
        } else {
          onAddItems(menuContext.items);
        }
      },
    });

    return () => {
      void OBR.contextMenu.remove(STAT_TRACKER_CONTEXT_MENU_ID);
    };
  }, [isReady, onAddItems, onRemoveItems]);
}
