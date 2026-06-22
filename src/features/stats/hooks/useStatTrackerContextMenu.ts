import { useEffect } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import { STAT_TRACKER_CONTEXT_MENU_ID } from "../statConstants";
type Options = { isReady: boolean; onAddItems: (items: Item[]) => void };
export function useStatTrackerContextMenu({ isReady, onAddItems }: Options): void { useEffect(() => { if (!isReady || !isObrReady()) return undefined; void OBR.contextMenu.create({ id: STAT_TRACKER_CONTEXT_MENU_ID, icons: [{ icon: "/icon.svg", label: "Add to Stat Tracker", filter: { min: 1 } }], onClick: (context) => onAddItems(context.items) }); return () => { void OBR.contextMenu.remove(STAT_TRACKER_CONTEXT_MENU_ID); }; }, [isReady, onAddItems]); }
