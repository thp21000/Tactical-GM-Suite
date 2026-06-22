import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../../shared/components/Button";
import type {
  InitiativeParticipant,
  InitiativeParticipantInput,
  InitiativeParticipantType,
} from "../initiativeTypes";

const participantTypes: InitiativeParticipantType[] = [
  "pc",
  "npc",
  "creature",
  "hazard",
  "unknown",
];

type InitiativeParticipantFormProps = {
  participant?: InitiativeParticipant;
  onCancel?: () => void;
  onSubmit: (input: InitiativeParticipantInput) => void;
};

function parseConditions(value: string): string[] {
  return value
    .split(",")
    .map((condition) => condition.trim())
    .filter(Boolean);
}

export function InitiativeParticipantForm({
  participant,
  onCancel,
  onSubmit,
}: InitiativeParticipantFormProps) {
  const [name, setName] = useState(participant?.name ?? "");
  const [type, setType] = useState<InitiativeParticipantType>(
    participant?.type ?? "unknown",
  );
  const [initiative, setInitiative] = useState(
    String(participant?.initiative ?? 0),
  );
  const [tieBreaker, setTieBreaker] = useState(
    participant?.tieBreaker === undefined ? "" : String(participant.tieBreaker),
  );
  const [conditions, setConditions] = useState(
    participant?.conditions.join(", ") ?? "",
  );
  const [notes, setNotes] = useState(participant?.notes ?? "");

  useEffect(() => {
    setName(participant?.name ?? "");
    setType(participant?.type ?? "unknown");
    setInitiative(String(participant?.initiative ?? 0));
    setTieBreaker(
      participant?.tieBreaker === undefined ? "" : String(participant.tieBreaker),
    );
    setConditions(participant?.conditions.join(", ") ?? "");
    setNotes(participant?.notes ?? "");
  }, [participant]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      name,
      type,
      initiative: Number(initiative) || 0,
      tieBreaker: tieBreaker === "" ? undefined : Number(tieBreaker),
      conditions: parseConditions(conditions),
      notes,
      sourceItemId: participant?.sourceItemId,
    });

    if (!participant) {
      setName("");
      setType("unknown");
      setInitiative("0");
      setTieBreaker("");
      setConditions("");
      setNotes("");
    }
  }

  return (
    <form className="initiative-form" onSubmit={handleSubmit}>
      <label>
        Nom
        <input
          onChange={(event) => setName(event.target.value)}
          required
          type="text"
          value={name}
        />
      </label>

      <label>
        Type
        <select
          onChange={(event) =>
            setType(event.target.value as InitiativeParticipantType)
          }
          value={type}
        >
          {participantTypes.map((participantType) => (
            <option key={participantType} value={participantType}>
              {participantType}
            </option>
          ))}
        </select>
      </label>

      <label>
        Initiative
        <input
          onChange={(event) => setInitiative(event.target.value)}
          type="number"
          value={initiative}
        />
      </label>

      <label>
        Tie-breaker
        <input
          onChange={(event) => setTieBreaker(event.target.value)}
          type="number"
          value={tieBreaker}
        />
      </label>

      <label className="initiative-form__wide">
        Conditions
        <input
          onChange={(event) => setConditions(event.target.value)}
          placeholder="grabbed, frightened 1"
          type="text"
          value={conditions}
        />
      </label>

      <label className="initiative-form__wide">
        Notes
        <textarea
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          value={notes}
        />
      </label>

      <div className="initiative-form__actions">
        <Button type="submit">{participant ? "Enregistrer" : "Ajouter"}</Button>
        {onCancel ? <Button onClick={onCancel}>Annuler</Button> : null}
      </div>
    </form>
  );
}
