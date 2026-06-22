import OBR, { type Metadata } from "@owlbear-rodeo/sdk";
import { ROOM_METADATA_KEYS, STORAGE_KEYS } from "../../../core/constants/ids";
import { isObrReady } from "../../../core/obr/obrReady";
import { readJson, removeItem, writeJson } from "../../../core/storage/localStorage";
import type { InitiativeEncounterState } from "../initiativeTypes";
import { createEmptyEncounter } from "./initiativeParticipants";

type InitiativeMetadata = Metadata & {
  [ROOM_METADATA_KEYS.INITIATIVE_STATE]?: InitiativeEncounterState;
};

function readStateFromMetadata(metadata: Metadata): InitiativeEncounterState | null {
  const state = (metadata as InitiativeMetadata)[ROOM_METADATA_KEYS.INITIATIVE_STATE];
  return state ?? null;
}

export async function readInitiativeState(): Promise<InitiativeEncounterState> {
  if (isObrReady()) {
    try {
      const metadata = await OBR.room.getMetadata();
      return readStateFromMetadata(metadata) ?? createEmptyEncounter();
    } catch {
      return createEmptyEncounter();
    }
  }

  return readJson<InitiativeEncounterState>(
    STORAGE_KEYS.INITIATIVE_FALLBACK_STATE,
    createEmptyEncounter(),
  );
}

export async function writeInitiativeState(
  state: InitiativeEncounterState,
): Promise<void> {
  if (isObrReady()) {
    await OBR.room.setMetadata({
      [ROOM_METADATA_KEYS.INITIATIVE_STATE]: state,
    });
    return;
  }

  writeJson(STORAGE_KEYS.INITIATIVE_FALLBACK_STATE, state);
}

export async function resetInitiativeState(): Promise<InitiativeEncounterState> {
  const state = createEmptyEncounter();

  if (isObrReady()) {
    await OBR.room.setMetadata({
      [ROOM_METADATA_KEYS.INITIATIVE_STATE]: state,
    });
    return state;
  }

  removeItem(STORAGE_KEYS.INITIATIVE_FALLBACK_STATE);
  writeJson(STORAGE_KEYS.INITIATIVE_FALLBACK_STATE, state);
  return state;
}

export function subscribeToInitiativeState(
  onChange: (state: InitiativeEncounterState) => void,
): () => void {
  if (!isObrReady()) {
    return () => undefined;
  }

  return OBR.room.onMetadataChange((metadata) => {
    const state = readStateFromMetadata(metadata);

    if (state) {
      onChange(state);
    }
  });
}
