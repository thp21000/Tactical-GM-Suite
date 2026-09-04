import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { useI18n } from "../../../i18n";
import { useStatRoomSettings } from "../hooks/useStatRoomSettings";
import { StatConditionContextMenuApp } from "./StatConditionContextMenuApp";

export function StatConditionContextAccessGate() {
  const { t } = useI18n();
  const [obrReady, setObrReady] = useState(false);
  const [role, setRole] = useState<"GM" | "PLAYER" | null>(null);
  const roomSettings = useStatRoomSettings(obrReady);

  useEffect(() => {
    let mounted = true;
    let unsubscribePlayer: (() => void) | undefined;

    OBR.onReady(() => {
      if (!mounted) return;
      setObrReady(true);
      void OBR.player.getRole().then((nextRole) => {
        if (mounted) setRole(nextRole);
      });
      unsubscribePlayer = OBR.player.onChange((player) => {
        if (mounted) setRole(player.role);
      });
    });

    return () => {
      mounted = false;
      unsubscribePlayer?.();
    };
  }, []);

  if (!obrReady || role === null || (role === "PLAYER" && roomSettings.loading)) {
    return (
      <main className="stat-condition-context stat-condition-context--empty">
        <p>{t("stats.conditions.loading")}</p>
      </main>
    );
  }

  if (role === "PLAYER" && !roomSettings.settings.allowPlayerConditions) {
    return (
      <main className="stat-condition-context stat-condition-context--empty">
        <p>{t("stats.conditions.error.playerAccessDenied")}</p>
      </main>
    );
  }

  return <StatConditionContextMenuApp />;
}
