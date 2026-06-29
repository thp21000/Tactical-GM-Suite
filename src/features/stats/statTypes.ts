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


export type StatConditionSeverity = "none" | "value" | "staged";

export type StatConditionDurationType =
  | "manual"
  | "rounds"
  | "encounter"
  | "rest";

export type StatConditionEffectTarget =
  | "armor-class"
  | "attack-roll"
  | "saving-throw"
  | "skill-check"
  | "perception"
  | "speed"
  | "actions"
  | "reactions"
  | "visibility"
  | "flat-check"
  | "initiative"
  | "other";

export type StatConditionEffectMode =
  | "status-penalty"
  | "circumstance-penalty"
  | "status-bonus"
  | "circumstance-bonus"
  | "set"
  | "disable"
  | "informational";

export type StatConditionCategory =
  | "physical"
  | "mental"
  | "sensory"
  | "magical"
  | "movement"
  | "combat"
  | "other";

export type StatConditionDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  description?: string;
  severityType: StatConditionSeverity;
  iconId: string;
  category: StatConditionCategory;
  effects?: StatConditionEffect[];
};

export type StatConditionEffect = {
  id: string;
  label: string;
  shortLabel: string;
  target: StatConditionEffectTarget;
  mode: StatConditionEffectMode;
  value?: number;
  scalesWithConditionValue?: boolean;
  description?: string;
};

export type StatTokenCondition = {
  id: string;
  conditionId: string;
  label: string;
  shortLabel: string;
  iconId: string;
  value?: number;
  durationType?: StatConditionDurationType;
  durationValue?: number;
  remainingRounds?: number;
  source?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
  conditions: StatTokenCondition[];
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
