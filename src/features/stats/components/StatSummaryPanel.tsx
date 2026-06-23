import type { StatTrackerSummary } from "../statTypes";

type Props = StatTrackerSummary;

const SUMMARY_ITEMS = [
  { key: "tokenCount", label: "Tokens suivis" },
  { key: "trackerCount", label: "Trackers" },
  { key: "groupCount", label: "Groupes" },
  { key: "visibleOnTokenCount", label: "Affichages token" },
] as const;

export function StatSummaryPanel(props: Props) {
  return (
    <div className="stat-summary">
      {SUMMARY_ITEMS.map((item) => (
        <div key={item.key}>
          <strong>{props[item.key]}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
