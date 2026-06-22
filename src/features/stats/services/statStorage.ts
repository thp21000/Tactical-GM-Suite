import OBR, { type Metadata } from "@owlbear-rodeo/sdk";
import { ROOM_METADATA_KEYS, STORAGE_KEYS } from "../../../core/constants/ids";
import { isObrReady } from "../../../core/obr/obrReady";
import { readJson, removeItem, writeJson } from "../../../core/storage/localStorage";
import type { StatTrackerState } from "../statTypes";
import { createEmptyStatTrackerState } from "./statEntities";
type StatMetadata = Metadata & { [ROOM_METADATA_KEYS.STAT_TRACKER_STATE]?: StatTrackerState };
function readStateFromMetadata(metadata: Metadata): StatTrackerState | null { return (metadata as StatMetadata)[ROOM_METADATA_KEYS.STAT_TRACKER_STATE] ?? null; }
export async function readStatTrackerState(): Promise<StatTrackerState> { if (isObrReady()) { try { const metadata = await OBR.room.getMetadata(); return readStateFromMetadata(metadata) ?? createEmptyStatTrackerState(); } catch { return createEmptyStatTrackerState(); } } return readJson<StatTrackerState>(STORAGE_KEYS.STAT_TRACKER_STATE, createEmptyStatTrackerState()); }
export async function writeStatTrackerState(state: StatTrackerState): Promise<void> { if (isObrReady()) { await OBR.room.setMetadata({ [ROOM_METADATA_KEYS.STAT_TRACKER_STATE]: state }); return; } writeJson(STORAGE_KEYS.STAT_TRACKER_STATE, state); }
export async function resetStatTrackerState(): Promise<StatTrackerState> { const state = createEmptyStatTrackerState(); if (isObrReady()) { await OBR.room.setMetadata({ [ROOM_METADATA_KEYS.STAT_TRACKER_STATE]: state }); return state; } removeItem(STORAGE_KEYS.STAT_TRACKER_STATE); writeJson(STORAGE_KEYS.STAT_TRACKER_STATE, state); return state; }
export function subscribeToStatTrackerState(onChange: (state: StatTrackerState) => void): () => void { if (!isObrReady()) return () => undefined; return OBR.room.onMetadataChange((metadata) => { const state = readStateFromMetadata(metadata); if (state) onChange(state); }); }
