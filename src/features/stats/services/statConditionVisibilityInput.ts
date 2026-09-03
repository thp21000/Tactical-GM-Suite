import type {
  StatConditionDurationType,
  StatConditionTokenDisplayMode,
  StatTrackerVisibility,
} from "../statTypes";

export type StatTokenConditionVisibilityInput = {
  value?: number;
  durationType?: StatConditionDurationType;
  durationValue?: number;
  remainingRounds?: number;
  source?: string;
  note?: string;
  showOnToken?: boolean;
  tokenDisplayMode?: StatConditionTokenDisplayMode;
  tokenDisplayPriority?: number;
  visibility?: StatTrackerVisibility;
};
