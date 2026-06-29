import { useState } from "react";
import { Button } from "../../../shared/components/Button";
import { getStatConditionDefinition, type StatTokenConditionInput } from "../services/statConditions";
import type {
  StatConditionDurationType,
  StatConditionTokenDisplayMode,
  StatTokenCondition,
} from "../statTypes";
import { StatConditionEffects } from "./StatConditionEffects";

type Props = {
  condition: StatTokenCondition;
  onCancel: () => void;
  onClearDuration: () => void;
  onDecrementDuration: () => void;
  onRemove: () => void;
  onSubmit: (input: StatTokenConditionInput) => void;
};

const DURATION_LABELS: Record<StatConditionDurationType, string> = {
  manual: "Manuelle",
  rounds: "Rounds",
  encounter: "Rencontre",
  rest: "Repos",
};

const TOKEN_DISPLAY_LABELS: Record<StatConditionTokenDisplayMode, string> = {
  badge: "Badge",
  icon: "Icône",
  hidden: "Masqué",
};

function getInitialDurationType(
  condition: StatTokenCondition,
): StatConditionDurationType {
  return condition.durationType ?? "manual";
}

export function StatConditionEditor({
  condition,
  onCancel,
  onClearDuration,
  onDecrementDuration,
  onRemove,
  onSubmit,
}: Props) {
  const definition = getStatConditionDefinition(condition.conditionId);
  const acceptsValue = definition?.severityType !== "none";
  const [value, setValue] = useState(String(condition.value ?? 1));
  const [durationType, setDurationType] = useState<StatConditionDurationType>(
    getInitialDurationType(condition),
  );
  const [rounds, setRounds] = useState(
    String(condition.remainingRounds ?? condition.durationValue ?? 1),
  );
  const [source, setSource] = useState(condition.source ?? "");
  const [note, setNote] = useState(condition.note ?? "");
  const [showOnToken, setShowOnToken] = useState(condition.showOnToken ?? false);
  const [tokenDisplayMode, setTokenDisplayMode] = useState<StatConditionTokenDisplayMode>(
    condition.tokenDisplayMode ?? "badge",
  );
  const [tokenDisplayPriority, setTokenDisplayPriority] = useState(
    String(condition.tokenDisplayPriority ?? 50),
  );

  return (
    <form
      className="stat-condition-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          value: acceptsValue ? Number(value) || 1 : undefined,
          durationType: durationType === "manual" ? undefined : durationType,
          durationValue: durationType === "rounds" ? Number(rounds) || 1 : undefined,
          remainingRounds: durationType === "rounds" ? Number(rounds) || 1 : undefined,
          source,
          note,
          showOnToken: tokenDisplayMode === "hidden" ? false : showOnToken,
          tokenDisplayMode,
          tokenDisplayPriority: Number(tokenDisplayPriority) || 50,
        });
      }}
    >
      <StatConditionEffects condition={condition} />

      <div className="stat-condition-editor__grid">
        {acceptsValue ? (
          <label>
            <span>Valeur</span>
            <input
              min="1"
              type="number"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
        ) : null}

        <label>
          <span>Durée</span>
          <select
            value={durationType}
            onChange={(event) =>
              setDurationType(event.target.value as StatConditionDurationType)
            }
          >
            {Object.entries(DURATION_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {durationType === "rounds" ? (
          <label>
            <span>Rounds</span>
            <input
              min="0"
              type="number"
              value={rounds}
              onChange={(event) => setRounds(event.target.value)}
            />
          </label>
        ) : null}

        <label>
          <span>Source</span>
          <input
            maxLength={40}
            type="text"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Source courte"
          />
        </label>

        <label>
          <span>Note</span>
          <input
            maxLength={80}
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note courte"
          />
        </label>
      </div>

      <div className="stat-condition-editor__display">
        <label className="stat-condition-editor__token-toggle">
          <input
            checked={showOnToken}
            type="checkbox"
            onChange={(event) => setShowOnToken(event.target.checked)}
          />
          <span>Token</span>
        </label>

        <label>
          <span>Mode</span>
          <select
            value={tokenDisplayMode}
            onChange={(event) =>
              setTokenDisplayMode(event.target.value as StatConditionTokenDisplayMode)
            }
          >
            {Object.entries(TOKEN_DISPLAY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Priorité</span>
          <input
            max="100"
            min="0"
            type="number"
            value={tokenDisplayPriority}
            onChange={(event) => setTokenDisplayPriority(event.target.value)}
          />
        </label>
      </div>

      <div className="stat-condition-editor__actions">
        <Button type="submit">Enregistrer</Button>
        <Button onClick={onCancel}>Annuler</Button>
        {condition.durationType === "rounds" ? (
          <Button
            onClick={() => {
              onDecrementDuration();
              setRounds((current) => String(Math.max(0, (Number(current) || 0) - 1)));
            }}
          >
            -1r
          </Button>
        ) : null}
        {condition.durationType ? (
          <Button
            onClick={() => {
              onClearDuration();
              setDurationType("manual");
            }}
          >
            Manuelle
          </Button>
        ) : null}
        <Button onClick={onRemove}>Retirer</Button>
      </div>
    </form>
  );
}
