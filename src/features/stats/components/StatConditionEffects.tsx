import { Badge } from "../../../shared/components/Badge";
import {
  getConditionEffectBadgeLabel,
  getConditionEffects,
} from "../services/statConditions";
import type { StatTokenCondition } from "../statTypes";

type Props = {
  condition: StatTokenCondition;
};

export function StatConditionEffects({ condition }: Props) {
  const effects = getConditionEffects(condition.conditionId);

  if (effects.length === 0) return null;

  return (
    <div className="stat-condition-effects" aria-label="Effets préparés">
      <span>Effets :</span>
      {effects.map((effect) => (
        <Badge key={effect.id}>{getConditionEffectBadgeLabel(effect, condition)}</Badge>
      ))}
    </div>
  );
}
