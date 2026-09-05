import OBR from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../../../core/constants/ids";

export const STAT_ROOM_SETTINGS_METADATA_KEY = `${EXTENSION_ID}/stats-room-settings`;
export const STAT_ROOM_SETTINGS_VERSION = 2;

export type StatTokenDockPosition = "top" | "bottom";

export type StatRoomSettings = {
  version: typeof STAT_ROOM_SETTINGS_VERSION;
  allowPlayerConditions: boolean;
  tokenStatsPosition: StatTokenDockPosition;
};

export const DEFAULT_STAT_ROOM_SETTINGS: StatRoomSettings = {
  version: STAT_ROOM_SETTINGS_VERSION,
  allowPlayerConditions: false,
  tokenStatsPosition: "top",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeTokenStatsPosition(value: unknown): StatTokenDockPosition {
  return value === "bottom" ? "bottom" : "top";
}

export function readStatRoomSettings(
  metadata: Record<string, unknown> | undefined,
): StatRoomSettings {
  const value = metadata?.[STAT_ROOM_SETTINGS_METADATA_KEY];
  if (!isRecord(value)) return DEFAULT_STAT_ROOM_SETTINGS;

  // V1 ne contenait que allowPlayerConditions. On la lit sans migration
  // destructive et on ajoute simplement la position par défaut du Stat Dock.
  return {
    version: STAT_ROOM_SETTINGS_VERSION,
    allowPlayerConditions: value.allowPlayerConditions === true,
    tokenStatsPosition: normalizeTokenStatsPosition(value.tokenStatsPosition),
  };
}

export async function getStatRoomSettings(): Promise<StatRoomSettings> {
  if (!OBR.isAvailable) return DEFAULT_STAT_ROOM_SETTINGS;
  const metadata = await OBR.room.getMetadata();
  return readStatRoomSettings(metadata);
}

export async function setStatRoomSettings(
  patch: Partial<Pick<StatRoomSettings, "allowPlayerConditions" | "tokenStatsPosition">>,
): Promise<StatRoomSettings> {
  if (!OBR.isAvailable) return { ...DEFAULT_STAT_ROOM_SETTINGS, ...patch };

  if ((await OBR.player.getRole()) !== "GM") {
    throw new Error("Only the GM can update Stats room settings.");
  }

  const current = await getStatRoomSettings();
  const next: StatRoomSettings = {
    ...current,
    ...patch,
    version: STAT_ROOM_SETTINGS_VERSION,
  };

  await OBR.room.setMetadata({
    [STAT_ROOM_SETTINGS_METADATA_KEY]: next,
  });

  return next;
}

/**
 * Les métadonnées room sont partagées avec tous les modules. On ne propage
 * donc que les changements réels des réglages Stats qui nous concernent.
 */
export function subscribeToStatRoomSettings(
  listener: (settings: StatRoomSettings) => void,
): () => void {
  if (!OBR.isAvailable) return () => undefined;

  let previousSignature: string | undefined;
  return OBR.room.onMetadataChange((metadata) => {
    const next = readStatRoomSettings(metadata);
    const signature = `${next.allowPlayerConditions ? 1 : 0}:${next.tokenStatsPosition}`;
    if (signature === previousSignature) return;
    previousSignature = signature;
    listener(next);
  });
}
