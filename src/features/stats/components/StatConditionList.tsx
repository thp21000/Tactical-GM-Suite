import { useMemo, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import {
  getStatConditionDefinition,
  getStatConditionDefinitions,
  getTokenDisplayConditions,
  type StatTokenConditionInput,
} from "../services/statConditions";
import { getTrackerIcon } from "../services/statTrackerIcons";
import type { StatTokenCondition, StatTrackedToken } from "../statTypes";
import { StatConditionEditor } from "./StatConditionEditor";

type Props = {
  token: StatTrackedToken;
  isGm: boolean;
  onAddCondition: (conditionId: string, value?: number) => void;
  onClearConditionDuration: (tokenConditionId: string) => void;
  onDecrementConditionDuration: (tokenConditionId: string) => void;
  onRemoveCondition: (tokenConditionId: string) => void;
  onUpdateCondition: (tokenConditionId: string, input: StatTokenConditionInput) => void;
};

function getDurationLabel(condition: StatTokenCondition): string | null {
  if (condition.durationType === "rounds") {
    return `${condition.remainingRounds ?? 0}r`;
  }

  if (condition.durationType === "encounter") return "rencontre";
  if (condition.durationType === "rest") return "repos";

  return null;
}

function getConditionBadgeLabel(condition: StatTokenCondition): string {
  const valueLabel =
    typeof condition.value === "number" ? ` ${condition.value}` : "";
  const durationLabel = getDurationLabel(condition);

  return `${condition.shortLabel}${valueLabel}${durationLabel ? ` · ${durationLabel}` : ""}`;
}

function getConditionTitle(condition: StatTokenCondition): string {
  return [condition.label, condition.source, condition.note]
    .filter(Boolean)
    .join(" · ");
}

export function StatConditionList({
  token,
  isGm,
  onAddCondition,
  onClearConditionDuration,
  onDecrementConditionDuration,
  onRemoveCondition,
  onUpdateCondition,
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
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
  const selectedDefinition = getStatConditionDefinition(selectedConditionId);
  const [value, setValue] = useState("1");
  const tokenDisplayConditions = getTokenDisplayConditions(token);

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
            const label = getConditionBadgeLabel(condition);

            return isGm ? (
              <button
                className="stat-condition-badge"
                key={condition.id}
                type="button"
                onClick={() => setEditingConditionId(condition.id)}
                title={getConditionTitle(condition) || `Modifier ${condition.label}`}
              >
                <span aria-hidden="true">{icon.symbol}</span>
                {label}
                {condition.showOnToken && condition.tokenDisplayMode !== "hidden" ? (
                  <span className="stat-condition-token-indicator">Token</span>
                ) : null}
                <span aria-hidden="true">✎</span>
              </button>
            ) : (
              <Badge key={condition.id}>
                {icon.symbol} {label}
              </Badge>
            );
          })
        )}
      </div>

      {isGm && tokenDisplayConditions.length > 0 ? (
        <p className="stat-condition-token-summary">
          {tokenDisplayConditions.length} condition
          {tokenDisplayConditions.length > 1 ? "s" : ""} prévue
          {tokenDisplayConditions.length > 1 ? "s" : ""} token
        </p>
      ) : null}

      {isGm
        ? token.conditions.map((condition) =>
            editingConditionId === condition.id ? (
              <StatConditionEditor
                condition={condition}
                key={condition.id}
                onCancel={() => setEditingConditionId(null)}
                onClearDuration={() => onClearConditionDuration(condition.id)}
                onDecrementDuration={() => onDecrementConditionDuration(condition.id)}
                onRemove={() => {
                  onRemoveCondition(condition.id);
                  setEditingConditionId(null);
                }}
                onSubmit={(input) => {
                  onUpdateCondition(condition.id, input);
                  setEditingConditionId(null);
                }}
              />
            ) : null,
          )
        : null}

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
