import { Badge } from "../../../shared/components/Badge";
import { getTokenDisplayItems, getTokenDisplayPreviewSummary } from "../services/statTokenDisplay";
import { getTrackerIcon } from "../services/statTrackerIcons";
import type { StatTrackedToken } from "../statTypes";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
  maxItems?: number;
};

export function StatTokenDisplayPreview({ token, isGm, maxItems = 6 }: Props) {
  const items = getTokenDisplayItems(token);

  if (items.length === 0) {
    return isGm ? (
      <div className="stat-token-display-preview stat-token-display-preview--empty">
        <span>Aucun aperçu token préparé.</span>
      </div>
    ) : null;
  }

  const visibleItems = items.slice(0, maxItems);
  const overflowCount = Math.max(0, items.length - visibleItems.length);

  return (
    <div className="stat-token-display-preview" aria-label="Aperçu token local">
      <div className="stat-token-display-preview__header">
        <span>Aperçu token</span>
        <small>{getTokenDisplayPreviewSummary(token)}</small>
      </div>

      <div className="stat-token-display-preview__items">
        {visibleItems.map((item) => {
          const icon = getTrackerIcon(item.iconId);

          return (
            <span key={item.id} title={item.title}>
              <Badge>
                <span aria-hidden="true">{icon.symbol}</span> {item.label}
              </Badge>
            </span>
          );
        })}

        {overflowCount > 0 ? <Badge>+{overflowCount}</Badge> : null}
      </div>
    </div>
  );
}
