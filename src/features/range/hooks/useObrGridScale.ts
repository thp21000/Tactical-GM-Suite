import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import type { RangeGridInfo } from "../rangeTypes";

export function useObrGridScale(isReady: boolean): RangeGridInfo {
  const [gridInfo, setGridInfo] = useState<RangeGridInfo>({});

  useEffect(() => {
    if (!isReady || !isObrReady()) {
      setGridInfo({});
      return undefined;
    }

    let mounted = true;
    Promise.all([OBR.scene.grid.getDpi(), OBR.scene.grid.getScale()])
      .then(([dpi, scale]) => {
        if (mounted) setGridInfo({ dpi, rawScale: scale.raw });
      })
      .catch(() => {
        if (mounted) setGridInfo({});
      });

    return OBR.scene.grid.onChange((grid) => {
      setGridInfo({ dpi: grid.dpi, rawScale: grid.scale });
    });
  }, [isReady]);

  return gridInfo;
}
