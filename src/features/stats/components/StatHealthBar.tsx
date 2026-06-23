import type { StatTracker } from "../statTypes";

type Props = { tracker: StatTracker };

export function StatHealthBar({ tracker }: Props) {
  const percent = tracker.max ? Math.max(0, Math.min(100, ((tracker.current ?? 0) / tracker.max) * 100)) : 0;
  return <div className="stat-health"><div className="stat-health__meta"><span>{tracker.current ?? 0}/{tracker.max ?? 0}</span></div><div className="stat-health__track"><span style={{ width: `${percent}%` }} /></div></div>;
}
