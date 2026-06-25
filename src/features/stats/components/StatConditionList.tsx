import { useMemo, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import {
  getStatConditionDefinition,
  getStatConditionDefinitions,
} from "../services/statConditions";
import { getTrackerIcon } from "../services/statTrackerIcons";
import type { StatTrackedToken } from "../statTypes";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
  onAddCondition: (conditionId: string, value?: number) => void;
  onRemoveCondition: (tokenConditionId: string) => void;
};

function getConditionBadgeLabel(condition: StatTrackedToken["conditions"][number]): string {
  return typeof condition.value === "number"
    ? `${condition.shortLabel} ${condition.value}`
    : condition.shortLabel;
}

export function StatConditionList({
  token,
  isGm,
  onAddCondition,
  onRemoveCondition,
}: Props) {
  const definitions = useMemo(() => getStatConditionDefinitions(), []);
  const availableDefinitions = definitions.filter(
    (definition) =>
      !token.conditions.some(
        (condition) => condition.conditionId === definition.id,
      ),
  );
  const [selectedConditionId, setSelectedConditionId] = useState(
    availableDefinitions[0]?.id ?? definitions[0]?.id ?? "",
  );
  const selectedDefinition = getStatConditionDefinition(selectedConditionId);
  const [value, setValue] = useState("1");

  const canAddSelected = Boolean(
    selectedDefinition &&
      !token.conditions.some(
        (condition) => condition.conditionId === selectedDefinition.id,
      ),
  );
  const needsValue = selectedDefinition
    ? selectedDefinition.severityType !== "none"
    : false;

  return (
    <div className="stat-condition-list">
      <div className="stat-condition-list__badges" aria-label="Conditions actives">
        {token.conditions.length === 0 ? (
          <span className="muted">Aucune condition active.</span>
        ) : (
          token.conditions.map((condition) => {
            const icon = getTrackerIcon(condition.iconId);

            return isGm ? (
              <button
                className="stat-condition-badge"
                key={condition.id}
                type="button"
                onClick={() => onRemoveCondition(condition.id)}
                title={`Retirer ${condition.label}`}
              >
                <span aria-hidden="true">{icon.symbol}</span>
                {getConditionBadgeLabel(condition)}
                <span aria-hidden="true">×</span>
              </button>
            ) : (
              <Badge key={condition.id}>
                {icon.symbol} {getConditionBadgeLabel(condition)}
              </Badge>
            );
          })
        )}
      </div>

      {isGm ? (
        <form
          className="stat-condition-picker"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selectedDefinition || !canAddSelected) return;

            onAddCondition(
              selectedDefinition.id,
              needsValue ? Number(value) || 1 : undefined,
            );
            const nextDefinition = availableDefinitions.find(
              (definition) => definition.id !== selectedDefinition.id,
            );
            if (nextDefinition) {
              setSelectedConditionId(nextDefinition.id);
            }
          }}
        >
          <label className="sr-only" htmlFor={`condition-${token.id}`}>
            Ajouter une condition
          </label>
          <select
            id={`condition-${token.id}`}
            value={selectedConditionId}
            onChange={(event) => setSelectedConditionId(event.target.value)}
          >
            {definitions.map((definition) => (
              <option
                disabled={token.conditions.some(
                  (condition) => condition.conditionId === definition.id,
                )}
                key={definition.id}
                value={definition.id}
              >
                {definition.label}
              </option>
            ))}
          </select>

          {needsValue ? (
            <input
              min="1"
              type="number"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-label="Valeur de condition"
            />
          ) : null}

          <Button disabled={!canAddSelected} type="submit">
            Ajouter condition
          </Button>
        </form>
      ) : null}
    </div>
  );
}
