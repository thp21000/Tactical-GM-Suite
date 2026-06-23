export type StatTokenType =
  | "pc"
  | "npc"
  | "enemy"
  | "mount"
  | "object"
  | "trap"
  | "familiar"
  | "other";

export type StatTrackerVisualType = "icon" | "bar" | "counter" | "readonly" | "toggle";

export type StatTrackerVisibility = "gm" | "private" | "public";

export type StatTrackerIconCategory =
  | "health"
  | "armor"
  | "magic"
  | "resource"
  | "money"
  | "combat"
  | "status"
  | "utility"
  | "other";

export type StatTrackerIcon = {
  id: string;
  label: string;
  category: StatTrackerIconCategory;
  symbol: string;
};

export type StatTracker = {
  id: string;
  name: string;
  visualType: StatTrackerVisualType;
  iconId: string;
  current?: number;
  max?: number;
  value?: number;
  enabled?: boolean;
  visibility: StatTrackerVisibility;
  canPlayerEdit: boolean;
  showOnToken: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StatTrackedToken = {
  id: string;
  sourceItemId?: string;
  name: string;
  tokenType: StatTokenType;
  trackers: StatTracker[];
  groupId?: string;
  assignedPlayerId?: string;
  assignedPlayerName?: string;
  notes?: string;
  isHiddenFromPlayers: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StatTokenGroup = {
  id: string;
  name: string;
  tokenIds: string[];
  primaryTokenId?: string;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StatTrackerInput = {
  name: string;
  visualType: StatTrackerVisualType;
  iconId: string;
  current?: number;
  max?: number;
  value?: number;
  enabled?: boolean;
  visibility?: StatTrackerVisibility;
  canPlayerEdit?: boolean;
  showOnToken?: boolean;
};

export type StatTrackerPreset = {
  id: string;
  label: string;
  tokenType: StatTokenType;
  trackers: StatTrackerInput[];
  createdAt?: string;
  updatedAt?: string;
};

export type StatTrackerPresetMap = Record<StatTokenType, StatTrackerPreset>;

export type StatTrackerState = {
  id: string;
  tokens: StatTrackedToken[];
  groups: StatTokenGroup[];
  presets: StatTrackerPresetMap;
  selectedTokenId?: string;
  createdAt: string;
  updatedAt: string;
};

export type StatTokenInput = {
  sourceItemId?: string;
  name: string;
  tokenType: StatTokenType;
  assignedPlayerId?: string;
  assignedPlayerName?: string;
  notes?: string;
  isHiddenFromPlayers?: boolean;
};

export type StatTrackerSummary = {
  tokenCount: number;
  trackerCount: number;
  groupCount: number;
  visibleOnTokenCount: number;
};

export type StatDisplayGroup = {
  id: string;
  name: string;
  tokens: StatTrackedToken[];
  isGroup: boolean;
  isCollapsed: boolean;
};
