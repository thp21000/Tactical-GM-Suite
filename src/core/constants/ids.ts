export const EXTENSION_ID = "fr.quentin.tactical-gm-suite";

export const MODULE_IDS = {
  CORE: "core-dashboard",
  INITIATIVE: "initiative-tracker",
  RANGE: "range-movement-attack",
  STATS: "stat-tracker",
  CALENDAR: "calendar",
  LOOT_TABLE: "loot-table",
} as const;

export const STORAGE_KEYS = {
  PREFERENCES: `${EXTENSION_ID}/preferences`,
  MODULE_STATES: `${EXTENSION_ID}/module-states`,
} as const;

export const ROOM_METADATA_KEYS = {
  CORE_STATE: `${EXTENSION_ID}/core-state`,
} as const;
