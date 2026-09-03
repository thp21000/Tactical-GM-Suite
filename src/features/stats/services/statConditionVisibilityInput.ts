import type { StatTrackerVisibility } from "../statTypes";
import type { StatTokenConditionInput } from "./statConditionStateActions";

export type StatTokenConditionVisibilityInput = StatTokenConditionInput & {
  visibility?: StatTrackerVisibility;
};
