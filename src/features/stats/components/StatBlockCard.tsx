import type { StatDisplayGroup, StatTokenInput, StatTrackerInput } from "../statTypes";
import { StatTrackedTokenBlock } from "./StatTrackedTokenBlock";

type Props = {
  group: StatDisplayGroup;
  onAddTracker: (tokenId: string, input: StatTrackerInput) => void;
  onChangeTrackerValue: (tokenId: string, trackerId: string, delta: number) => void;
  onRemoveToken: (tokenId: string) => void;
  onRemoveTracker: (tokenId: string, trackerId: string) => void;
  onToggleTracker: (tokenId: string, trackerId: string) => void;
  onUpdateToken: (tokenId: string, input: Partial<StatTokenInput>) => void;
  onUpdateTracker: (tokenId: string, trackerId: string, input: Partial<StatTrackerInput>) => void;
};

export function StatBlockCard(props: Props) {
  return <StatTrackedTokenBlock {...props} />;
}
