import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import { createOrUpdateTokenConditionOverlay } from "./statConditionOverlayObrSync";
import { readEmbeddedStatToken } from "./statTokenSceneLinks";

const GEOMETRY_SYNC_DEBOUNCE_MS = 80;

function getScaleSignature(item: Item): string {
  return `${item.scale.x}:${item.scale.y}`;
}

/**
 * Conditions own their own geometry synchronization in the permanent Owlbear
 * background. Position attachment follows token movement automatically; this
 * listener only recalculates the ring radius when the token is resized.
 */
export function setupStatConditionOverlayAutoSync(): () => void {
  let disposed = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const scaleByItemId = new Map<string, string>();
  const pending = new Map<string, StatTrackedToken>();

  const flush = async () => {
    timeout = null;
    if (disposed || pending.size === 0) return;

    const updates = [...pending.values()];
    pending.clear();
    for (const token of updates) {
      if (disposed) return;
      await createOrUpdateTokenConditionOverlay(token).catch(() => undefined);
    }
  };

  const schedule = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => void flush(), GEOMETRY_SYNC_DEBOUNCE_MS);
  };

  const inspectItems = (items: Item[], initial = false) => {
    if (disposed) return;

    const presentIds = new Set<string>();
    let changed = false;

    for (const item of items) {
      const token = readEmbeddedStatToken(item);
      if (!token || token.conditions.length === 0) continue;

      presentIds.add(item.id);
      const signature = getScaleSignature(item);
      const previous = scaleByItemId.get(item.id);
      scaleByItemId.set(item.id, signature);

      if (!initial && previous !== undefined && previous !== signature) {
        pending.set(item.id, token);
        changed = true;
      }
    }

    for (const itemId of [...scaleByItemId.keys()]) {
      if (!presentIds.has(itemId)) scaleByItemId.delete(itemId);
    }

    if (changed) schedule();
  };

  void Promise.all([OBR.player.getRole(), OBR.scene.isReady()])
    .then(async ([role, ready]) => {
      if (disposed || role !== "GM" || !ready) return;
      const items = await OBR.scene.items.getItems();
      if (!disposed) inspectItems(items, true);
    })
    .catch(() => undefined);

  const unsubscribe = OBR.scene.items.onChange((items) => inspectItems(items));

  return () => {
    disposed = true;
    if (timeout) clearTimeout(timeout);
    pending.clear();
    scaleByItemId.clear();
    unsubscribe();
  };
}
