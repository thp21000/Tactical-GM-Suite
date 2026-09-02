import { useEffect, useMemo, useState } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { StatTrackedToken } from "../statTypes";
import {
  ensureCurrentSceneStatTokenLinks,
  getSceneStatTokenInstances,
} from "../services/statTokenSceneLinks";

type Options = {
  enabled: boolean;
  isGm: boolean;
  tokens: StatTrackedToken[];
  onSceneItems: (items: Item[]) => void;
};

export function useStatSceneTokenBindings({
  enabled,
  isGm,
  tokens,
  onSceneItems,
}: Options) {
  const [items, setItems] = useState<Item[]>([]);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!enabled || !OBR.isAvailable) {
      setItems([]);
      setSceneReady(false);
      onSceneItems([]);
      return undefined;
    }

    let mounted = true;

    const applyItems = (nextItems: Item[]) => {
      if (!mounted) return;
      setItems(nextItems);
      onSceneItems(nextItems);
    };

    const refresh = async () => {
      try {
        const ready = await OBR.scene.isReady();
        if (!mounted) return;
        setSceneReady(ready);
        if (!ready) {
          applyItems([]);
          return;
        }

        const nextItems = await OBR.scene.items.getItems();
        applyItems(nextItems);
      } catch {
        if (mounted) {
          setSceneReady(false);
          applyItems([]);
        }
      }
    };

    void refresh();

    const unsubscribeItems = OBR.scene.items.onChange((nextItems) => {
      if (!mounted) return;
      applyItems(nextItems);
      setSceneReady(true);
    });

    const unsubscribeReady = OBR.scene.onReadyChange((ready) => {
      if (!mounted) return;
      setSceneReady(ready);
      if (!ready) {
        applyItems([]);
        return;
      }
      void refresh();
    });

    return () => {
      mounted = false;
      unsubscribeItems();
      unsubscribeReady();
    };
  }, [enabled, onSceneItems]);

  useEffect(() => {
    if (!enabled || !isGm || !sceneReady) return;
    void ensureCurrentSceneStatTokenLinks(tokens, items).catch(() => undefined);
  }, [enabled, isGm, items, sceneReady, tokens]);

  const sceneTokens = useMemo(
    () => getSceneStatTokenInstances(tokens, items),
    [items, tokens],
  );

  return {
    sceneReady,
    sceneTokens,
    sceneItemCount: items.length,
  };
}
