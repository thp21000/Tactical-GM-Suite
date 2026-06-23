import OBR, { type Metadata } from "@owlbear-rodeo/sdk";
import { ROOM_METADATA_KEYS, STORAGE_KEYS } from "../../../core/constants/ids";
import { isObrReady } from "../../../core/obr/obrReady";
import { readJson, removeItem, writeJson } from "../../../core/storage/localStorage";
import type { StatTrackerState } from "../statTypes";
import { normalizeStatTrackerPresets } from "./statPresets";
import { createTracker } from "./statTrackers";
import {
  createEmptyStatTrackerState,
  createTrackedToken,
  normalizeTokenType,
} from "./statTokens";

type StatMetadata = Metadata & {
  [ROOM_METADATA_KEYS.STAT_TRACKER_STATE]?: unknown;
};

type LegacyResource = {
  id?: string;
  name?: string;
  current?: number;
  max?: number;
};

type LegacyEntity = {
  id?: string;
  sourceItemId?: string;
  name?: string;
  type?: string;
  armorClass?: number;
  maxHp?: number;
  currentHp?: number;
  tempHp?: number;
  conditions?: { name?: string }[];
  resources?: LegacyResource[];
  notes?: string;
  isHiddenFromPlayers?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type LegacyState = {
  id?: string;
  entities?: LegacyEntity[];
  createdAt?: string;
  updatedAt?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isV21State(value: unknown): value is StatTrackerState {
  return isRecord(value) && Array.isArray(value.tokens) && Array.isArray(value.groups);
}

function migrateLegacyEntity(entity: LegacyEntity) {
  const token = createTrackedToken({
    sourceItemId: entity.sourceItemId,
    name: entity.name || "Token",
    tokenType: normalizeTokenType(entity.type),
    notes: entity.notes,
    isHiddenFromPlayers: entity.isHiddenFromPlayers ?? false,
  });

  const trackers = [];

  if (typeof entity.currentHp === "number" || typeof entity.maxHp === "number") {
    trackers.push(
      createTracker({
        name: "PV",
        visualType: "bar",
        iconId: "heart",
        current: entity.currentHp ?? entity.maxHp ?? 0,
        max: entity.maxHp ?? entity.currentHp ?? 0,
        visibility: "gm",
      }),
    );
  }

  if (typeof entity.tempHp === "number" && entity.tempHp > 0) {
    trackers.push(
      createTracker({
        name: "PVT",
        visualType: "counter",
        iconId: "temp-heart",
        value: entity.tempHp,
        visibility: "gm",
      }),
    );
  }

  if (typeof entity.armorClass === "number") {
    trackers.push(
      createTracker({
        name: "CA",
        visualType: "readonly",
        iconId: "armor",
        value: entity.armorClass,
        visibility: "gm",
      }),
    );
  }

  for (const resource of entity.resources ?? []) {
    const max = typeof resource.max === "number" ? resource.max : undefined;
    const current = typeof resource.current === "number" ? resource.current : max ?? 0;

    trackers.push(
      createTracker({
        name: resource.name || "Ressource",
        visualType: max && max > 1 ? "bar" : "counter",
        iconId: "counter",
        current,
        max,
        value: current,
        visibility: "gm",
      }),
    );
  }

  for (const condition of entity.conditions ?? []) {
    if (condition.name) {
      trackers.push(
        createTracker({
          name: condition.name,
          visualType: "icon",
          iconId: "toggle",
          visibility: "gm",
        }),
      );
    }
  }

  return {
    ...token,
    trackers,
    createdAt: entity.createdAt ?? token.createdAt,
    updatedAt: entity.updatedAt ?? token.updatedAt,
  };
}

export function normalizeStatTrackerState(value: unknown): StatTrackerState {
  if (isV21State(value)) {
    const fallback = createEmptyStatTrackerState();

    return {
      id: typeof value.id === "string" ? value.id : fallback.id,
      tokens: value.tokens.map((token) => ({
        ...token,
        trackers: Array.isArray(token.trackers) ? token.trackers : [],
      })),
      groups: value.groups,
      presets: normalizeStatTrackerPresets(
        isRecord(value) ? value.presets : undefined,
      ),
      selectedTokenId: value.selectedTokenId,
      createdAt:
        typeof value.createdAt === "string" ? value.createdAt : fallback.createdAt,
      updatedAt:
        typeof value.updatedAt === "string" ? value.updatedAt : fallback.updatedAt,
    };
  }

  if (isRecord(value) && Array.isArray((value as LegacyState).entities)) {
    const legacy = value as LegacyState;
    const fallback = createEmptyStatTrackerState();

    return {
      ...fallback,
      id: legacy.id ?? fallback.id,
      tokens: (legacy.entities ?? []).map(migrateLegacyEntity),
      groups: [],
      createdAt: legacy.createdAt ?? fallback.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  return createEmptyStatTrackerState();
}

function readStateFromMetadata(metadata: Metadata): StatTrackerState | null {
  const state = (metadata as StatMetadata)[ROOM_METADATA_KEYS.STAT_TRACKER_STATE];

  return state ? normalizeStatTrackerState(state) : null;
}

export async function readStatTrackerState(): Promise<StatTrackerState> {
  if (isObrReady()) {
    try {
      const metadata = await OBR.room.getMetadata();

      return readStateFromMetadata(metadata) ?? createEmptyStatTrackerState();
    } catch {
      return createEmptyStatTrackerState();
    }
  }

  return normalizeStatTrackerState(
    readJson<unknown>(STORAGE_KEYS.STAT_TRACKER_STATE, createEmptyStatTrackerState()),
  );
}

export async function writeStatTrackerState(state: StatTrackerState): Promise<void> {
  if (isObrReady()) {
    await OBR.room.setMetadata({ [ROOM_METADATA_KEYS.STAT_TRACKER_STATE]: state });
    return;
  }

  writeJson(STORAGE_KEYS.STAT_TRACKER_STATE, state);
}

export async function resetStatTrackerState(): Promise<StatTrackerState> {
  const state = createEmptyStatTrackerState();

  if (isObrReady()) {
    await OBR.room.setMetadata({ [ROOM_METADATA_KEYS.STAT_TRACKER_STATE]: state });
    return state;
  }

  removeItem(STORAGE_KEYS.STAT_TRACKER_STATE);
  writeJson(STORAGE_KEYS.STAT_TRACKER_STATE, state);

  return state;
}

export function subscribeToStatTrackerState(
  onChange: (state: StatTrackerState) => void,
): () => void {
  if (!isObrReady()) return () => undefined;

  return OBR.room.onMetadataChange((metadata) => {
    const state = readStateFromMetadata(metadata);
    if (state) onChange(state);
  });
}
