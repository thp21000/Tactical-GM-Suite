import OBR from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../../../core/constants/ids";

export const STAT_ROOM_SETTINGS_METADATA_KEY = `${EXTENSION_ID}/stats-room-settings`;
export const STAT_ROOM_SETTINGS_VERSION = 1;

export type StatRoomSettings = {
  version: typeof STAT_ROOM_SETTINGS_VERSION;
  allowPlayerConditions: boolean;
};

export const DEFAULT_STAT_ROOM_SETTINGS: StatRoomSettings = {
  version: STAT_ROOM_SETTINGS_VERSION,
  allowPlayerConditions: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readStatRoomSettings(
  metadata: Record<string, unknown> | undefined,
): StatRoomSettings {
  const value = metadata?.[STAT_ROOM_SETTINGS_METADATA_KEY];
  if (!isRecord(value) || value.version !== STAT_ROOM_SETTINGS_VERSION) {
    return DEFAULT_STAT_ROOM_SETTINGS;
  }

  return {
    version: STAT_ROOM_SETTINGS_VERSION,
    allowPlayerConditions: value.allowPlayerConditions === true,
  };
}

export async function getStatRoomSettings(): Promise<StatRoomSettings> {
  if (!OBR.isAvailable) return DEFAULT_STAT_ROOM_SETTINGS;
  const metadata = await OBR.room.getMetadata();
  return readStatRoomSettings(metadata);
}

export async function setStatRoomSettings(
  patch: Partial<Pick<StatRoomSettings, "allowPlayerConditions">>,
): Promise<StatRoomSettings> {
  if (!OBR.isAvailable) {
    return { ...DEFAULT_STAT_ROOM_SETTINGS, ...patch };
  }

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

export function subscribeToStatRoomSettings(
  listener: (settings: StatRoomSettings) => void,
): () => void {
  if (!OBR.isAvailable) return () => undefined;
  return OBR.room.onMetadataChange((metadata) => {
    listener(readStatRoomSettings(metadata));
  });
}
