import type { StatTrackerSummary } from "../statTypes";

type Props = StatTrackerSummary;

export function StatSummaryPanel({ groupCount, tokenCount, trackerCount, visibleOnTokenCount }: Props) {
  return (
    <div className="stat-summary">
      <div><strong>{tokenCount}</strong><span>Tokens suivis</span></div>
      <div><strong>{trackerCount}</strong><span>Trackers</span></div>
      <div><strong>{groupCount}</strong><span>Groupes</span></div>
      <div><strong>{visibleOnTokenCount}</strong><span>Visibles sur token</span></div>
    </div>
  );
}
