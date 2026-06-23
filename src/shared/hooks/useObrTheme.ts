import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import type { ObrReadyState } from "../../core/obr/obrReady";
import {
  applyThemeVariables,
  createTgmThemeFromObrTheme,
  fallbackTgmTheme,
  type TgmTheme,
} from "../../core/theme/obrTheme";

export function useObrTheme(obr: ObrReadyState): TgmTheme {
  const [theme, setTheme] = useState<TgmTheme>(fallbackTgmTheme);

  useEffect(() => {
    applyThemeVariables(fallbackTgmTheme);
    setTheme(fallbackTgmTheme);

    if (!obr.isAvailable || !obr.isReady) {
      return undefined;
    }

    let isMounted = true;

    OBR.theme.getTheme()
      .then((obrTheme) => {
        if (!isMounted) {
          return;
        }

        const nextTheme = createTgmThemeFromObrTheme(obrTheme);
        applyThemeVariables(nextTheme);
        setTheme(nextTheme);
      })
      .catch(() => {
        // The installed SDK exposes OBR.theme, but local/offline contexts can still reject theme reads.
        applyThemeVariables(fallbackTgmTheme);
        setTheme(fallbackTgmTheme);
      });

    const unsubscribe = OBR.theme.onChange((obrTheme) => {
      const nextTheme = createTgmThemeFromObrTheme(obrTheme);
      applyThemeVariables(nextTheme);
      setTheme(nextTheme);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [obr.isAvailable, obr.isReady]);

  return theme;
}
