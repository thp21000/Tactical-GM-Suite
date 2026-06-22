import OBR, { type BoundingBox, type Item } from "@owlbear-rodeo/sdk";
import type { RangeTrackedItem } from "../rangeTypes";
import { getBoundsCenter, normalizeObrBounds } from "./rangeGeometry";

export async function itemToTrackedItem(item: Item): Promise<RangeTrackedItem | null> {
  try {
    const bounds: BoundingBox = await OBR.scene.items.getItemBounds([item.id]);
    const normalizedBounds = normalizeObrBounds(bounds);
    return { id: item.id, itemId: item.id, name: item.name || "Token", center: getBoundsCenter(normalizedBounds), bounds: normalizedBounds };
  } catch {
    return { id: item.id, itemId: item.id, name: item.name || "Token", center: { x: item.position.x, y: item.position.y } };
  }
}

export async function itemsToTrackedItems(items: Item[]): Promise<RangeTrackedItem[]> {
  const trackedItems = await Promise.all(items.map((item) => itemToTrackedItem(item)));
  return trackedItems.filter((item): item is RangeTrackedItem => Boolean(item));
}
