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
};

export function useStatSceneTokenBindings({ enabled, isGm, tokens }: Options) {
  const [items, setItems] = useState<Item[]>([]);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!enabled || !OBR.isAvailable) {
      setItems([]);
      setSceneReady(false);
      return undefined;
    }

    let mounted = true;

    const refresh = async () => {
      try {
        const ready = await OBR.scene.isReady();
        if (!mounted) return;
        setSceneReady(ready);
        if (!ready) {
          setItems([]);
          return;
        }

        const nextItems = await OBR.scene.items.getItems();
        if (mounted) setItems(nextItems);
      } catch {
        if (mounted) {
          setSceneReady(false);
          setItems([]);
        }
      }
    };

    void refresh();

    const unsubscribeItems = OBR.scene.items.onChange((nextItems) => {
      if (!mounted) return;
      setItems(nextItems);
      setSceneReady(true);
    });

    const unsubscribeReady = OBR.scene.onReadyChange((ready) => {
      if (!mounted) return;
      setSceneReady(ready);
      if (!ready) {
        setItems([]);
        return;
      }
      void refresh();
    });

    return () => {
      mounted = false;
      unsubscribeItems();
      unsubscribeReady();
    };
  }, [enabled]);

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
