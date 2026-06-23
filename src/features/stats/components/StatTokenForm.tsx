import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../../shared/components/Button";
import { STAT_TOKEN_TYPE_OPTIONS } from "../services/statLabels";
import type {
  StatTokenInput,
  StatTokenType,
  StatTrackedToken,
} from "../statTypes";

type Props = {
  token?: StatTrackedToken;
  onCancel?: () => void;
  onSubmit: (input: StatTokenInput) => void;
};

export function StatTokenForm({ onCancel, onSubmit, token }: Props) {
  const [name, setName] = useState(token?.name ?? "");
  const [tokenType, setTokenType] = useState<StatTokenType>(
    token?.tokenType ?? "other",
  );
  const [assignedPlayerName, setAssignedPlayerName] = useState(
    token?.assignedPlayerName ?? "",
  );
  const [assignedPlayerId, setAssignedPlayerId] = useState(
    token?.assignedPlayerId ?? "",
  );
  const [notes, setNotes] = useState(token?.notes ?? "");

  useEffect(() => {
    setName(token?.name ?? "");
    setTokenType(token?.tokenType ?? "other");
    setAssignedPlayerName(token?.assignedPlayerName ?? "");
    setAssignedPlayerId(token?.assignedPlayerId ?? "");
    setNotes(token?.notes ?? "");
  }, [token]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      sourceItemId: token?.sourceItemId,
      name,
      tokenType,
      assignedPlayerName,
      assignedPlayerId,
      notes,
      isHiddenFromPlayers: token?.isHiddenFromPlayers,
    });

    if (!token) {
      setName("");
      setTokenType("other");
      setAssignedPlayerName("");
      setAssignedPlayerId("");
      setNotes("");
    }
  }

  return (
    <form className="stat-form" onSubmit={submit}>
      <label>
        Nom
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label>
        Type
        <select
          value={tokenType}
          onChange={(event) =>
            setTokenType(event.target.value as StatTokenType)
          }
        >
          {STAT_TOKEN_TYPE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Joueur assigné
        <input
          value={assignedPlayerName}
          onChange={(event) => setAssignedPlayerName(event.target.value)}
          placeholder="Nom affiché du joueur"
        />
      </label>

      <label>
        ID joueur
        <input
          value={assignedPlayerId}
          onChange={(event) => setAssignedPlayerId(event.target.value)}
          placeholder="Optionnel, pour liaison future"
        />
      </label>

      <label className="stat-form__wide">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
        />
      </label>

      <div className="stat-form__actions">
        <Button type="submit">{token ? "Enregistrer" : "Ajouter"}</Button>
        {onCancel ? <Button onClick={onCancel}>Annuler</Button> : null}
      </div>
    </form>
  );
}
