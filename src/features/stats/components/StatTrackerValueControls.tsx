import { Button } from "../../../shared/components/Button";
import type { StatTracker } from "../statTypes";
import { canQuickModifyTracker } from "../services/statTrackers";

type Props = { tracker: StatTracker; onChange: (delta: number) => void };

export function StatTrackerValueControls({ onChange, tracker }: Props) {
  if (!canQuickModifyTracker(tracker)) return null;
  return (
    <div className="stat-tracker-controls" aria-label={`Contrôles ${tracker.name}`}>
      <Button onClick={() => onChange(-5)}>-5</Button>
      <Button onClick={() => onChange(-1)}>-1</Button>
      <Button onClick={() => onChange(1)}>+1</Button>
      <Button onClick={() => onChange(5)}>+5</Button>
    </div>
  );
}
