import { useEffect, useMemo, useState } from "react";
import OBR, { type Player } from "@owlbear-rodeo/sdk";
import { isObrReady } from "../../../core/obr/obrReady";
import { GM_VIEWER, type StatPermissionViewer } from "../services/statPermissions";

function viewerFromPlayer(player: Player): StatPermissionViewer {
  if (player.role === "PLAYER") {
    return { role: "player", playerId: player.id, playerName: player.name };
  }

  return GM_VIEWER;
}

function getViewerLabel(viewer: StatPermissionViewer): string {
  if (viewer.role === "gm") return "Mode MJ";
  return viewer.playerName ? `Mode joueur · ${viewer.playerName}` : "Mode joueur";
}

export function useStatPermissionViewer(isReady: boolean) {
  const [viewer, setViewer] = useState<StatPermissionViewer>(GM_VIEWER);

  useEffect(() => {
    if (!isReady || !isObrReady()) {
      setViewer(GM_VIEWER);
      return undefined;
    }

    let mounted = true;

    async function loadViewer() {
      try {
        const role = await OBR.player.getRole();
        if (role === "GM") {
          if (mounted) setViewer(GM_VIEWER);
          return;
        }

        const [playerId, playerName] = await Promise.all([
          OBR.player.getId().catch(() => undefined),
          OBR.player.getName().catch(() => undefined),
        ]);

        if (mounted) setViewer({ role: "player", playerId, playerName });
      } catch {
        // Fallback volontaire : si l'API joueur n'est pas disponible ou pas prête,
        // l'interface reste en mode MJ pour ne pas masquer de données au MJ.
        if (mounted) setViewer(GM_VIEWER);
      }
    }

    void loadViewer();
    const unsubscribe = OBR.player.onChange((player) => {
      setViewer(viewerFromPlayer(player));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isReady]);

  const viewerLabel = useMemo(() => getViewerLabel(viewer), [viewer]);

  return { viewer, isGm: viewer.role === "gm", viewerLabel };
}
