import {
  getTacticalTokenContextKeyFilters,
  isSupportedTacticalTokenItem,
} from "../../../core/tokens/tokenEligibility";

export const isSupportedStatTokenItem = isSupportedTacticalTokenItem;
export const getStatTokenContextKeyFilters = getTacticalTokenContextKeyFilters;
