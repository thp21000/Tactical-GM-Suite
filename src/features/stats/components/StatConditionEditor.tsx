import { useState } from "react";
import { Button } from "../../../shared/components/Button";
import {
  getStatConditionDefinition,
  type StatTokenConditionInput,
} from "../services/statConditions";
import type {
  StatConditionDurationType,
  StatTrackerVisibility,
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
  const acceptsValue = definition ? definition.severityType !== "none" : false;
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
  const [visibility, setVisibility] = useState<StatTrackerVisibility>(
    condition.visibility ?? "public",
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
          showOnToken,
          tokenDisplayMode: showOnToken ? "icon" : "hidden",
          tokenDisplayPriority: 50,
          visibility,
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
          <span>Afficher l’anneau sur le token</span>
        </label>

        <label>
          <span>Visibilité</span>
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as StatTrackerVisibility)
            }
          >
            <option value="public">Public</option>
            <option value="private">Privé</option>
            <option value="gm">MJ</option>
          </select>
        </label>
      </div>

      {showOnToken ? (
        <p className="muted">
          Une seule condition peut entourer le token. En enregistrant, celle-ci
          remplacera automatiquement l’anneau actuellement affiché.
        </p>
      ) : null}

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
