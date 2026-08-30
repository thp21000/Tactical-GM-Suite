import type { StatTrackerVisibility } from "../statTypes";
import type { StatTokenConditionInput } from "./statConditions";

export type StatTokenConditionVisibilityInput = StatTokenConditionInput & {
  visibility?: StatTrackerVisibility;
};
