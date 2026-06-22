import { useCallback, useEffect, useState } from "react";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";

export function useObrSceneItems(isReady: boolean) {
  const [items, setItems] = useState<Item[]>([]);

  const refreshItems = useCallback(() => {
    if (!isReady || !isObrReady()) {
      setItems([]);
      return;
    }

    void OBR.scene.items.getItems().then(setItems).catch(() => setItems([]));
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !isObrReady()) {
      setItems([]);
      return undefined;
    }

    refreshItems();
    return OBR.scene.items.onChange(setItems);
  }, [isReady, refreshItems]);

  return { items, refreshItems };
}
