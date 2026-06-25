import type {
  StatDisplayGroup,
  StatTokenInput,
  StatTrackerInput,
} from "../statTypes";
import type { StatPermissionViewer } from "../services/statPermissions";
import type { StatTokenConditionInput } from "../services/statConditions";
import { StatTrackedTokenBlock } from "./StatTrackedTokenBlock";

type Props = {
  group: StatDisplayGroup;
  isGm: boolean;
  viewer: StatPermissionViewer;
  onAddCondition: (tokenId: string, conditionId: string, value?: number) => void;
  onClearConditionDuration: (tokenId: string, tokenConditionId: string) => void;
  onAddTracker: (tokenId: string, input: StatTrackerInput) => void;
  onApplyPreset: (tokenId: string) => void;
  onChangeTrackerValue: (tokenId: string, trackerId: string, delta: number) => void;
  onDecrementConditionDuration: (tokenId: string, tokenConditionId: string) => void;
  onRemoveCondition: (tokenId: string, tokenConditionId: string) => void;
  onRemoveToken: (tokenId: string) => void;
  onRemoveTracker: (tokenId: string, trackerId: string) => void;
  onToggleTracker: (tokenId: string, trackerId: string) => void;
  onUpdateCondition: (
    tokenId: string,
    tokenConditionId: string,
    input: StatTokenConditionInput,
  ) => void;
  onUpdateToken: (tokenId: string, input: Partial<StatTokenInput>) => void;
  onUpdateTracker: (
    tokenId: string,
    trackerId: string,
    input: Partial<StatTrackerInput>,
  ) => void;
};

export function StatBlockCard(props: Props) {
  return <StatTrackedTokenBlock {...props} />;
}
