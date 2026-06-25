import type {
  StatDisplayGroup,
  StatTokenInput,
  StatTrackerInput,
} from "../statTypes";
import type { StatPermissionViewer } from "../services/statPermissions";
import { StatTrackedTokenBlock } from "./StatTrackedTokenBlock";

type Props = {
  group: StatDisplayGroup;
  isGm: boolean;
  viewer: StatPermissionViewer;
  onAddCondition: (tokenId: string, conditionId: string, value?: number) => void;
  onAddTracker: (tokenId: string, input: StatTrackerInput) => void;
  onApplyPreset: (tokenId: string) => void;
  onChangeTrackerValue: (tokenId: string, trackerId: string, delta: number) => void;
  onRemoveCondition: (tokenId: string, tokenConditionId: string) => void;
  onRemoveToken: (tokenId: string) => void;
  onRemoveTracker: (tokenId: string, trackerId: string) => void;
  onToggleTracker: (tokenId: string, trackerId: string) => void;
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
