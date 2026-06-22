import { useEffect } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import { RANGE_CLEAR_TARGETS_CONTEXT_MENU_ID, RANGE_ORIGIN_CONTEXT_MENU_ID, RANGE_TARGET_CONTEXT_MENU_ID } from "../rangeConstants";
import type { RangeTrackedItem } from "../rangeTypes";
import { itemsToTrackedItems } from "../services/rangeItemSelection";

type UseRangeContextMenuOptions = {
  isReady: boolean;
  onSetOrigin: (item: RangeTrackedItem) => void;
  onAddTargets: (items: RangeTrackedItem[]) => void;
  onClearTargets: () => void;
};

export function useRangeContextMenu({ isReady, onAddTargets, onClearTargets, onSetOrigin }: UseRangeContextMenuOptions): void {
  useEffect(() => {
    if (!isReady || !isObrReady()) return undefined;

    void OBR.contextMenu.create({ id: RANGE_ORIGIN_CONTEXT_MENU_ID, icons: [{ icon: "/icon.svg", label: "Set as range origin", filter: { min: 1 } }], onClick: (context) => { void itemsToTrackedItems(context.items).then((items) => { if (items[0]) onSetOrigin(items[0]); }); } });
    void OBR.contextMenu.create({ id: RANGE_TARGET_CONTEXT_MENU_ID, icons: [{ icon: "/icon.svg", label: "Add as range target", filter: { min: 1 } }], onClick: (context) => { void itemsToTrackedItems(context.items).then(onAddTargets); } });
    void OBR.contextMenu.create({ id: RANGE_CLEAR_TARGETS_CONTEXT_MENU_ID, icons: [{ icon: "/icon.svg", label: "Clear range targets", filter: { min: 1 } }], onClick: () => onClearTargets() });

    return () => {
      void OBR.contextMenu.remove(RANGE_ORIGIN_CONTEXT_MENU_ID);
      void OBR.contextMenu.remove(RANGE_TARGET_CONTEXT_MENU_ID);
      void OBR.contextMenu.remove(RANGE_CLEAR_TARGETS_CONTEXT_MENU_ID);
    };
  }, [isReady, onAddTargets, onClearTargets, onSetOrigin]);
}
