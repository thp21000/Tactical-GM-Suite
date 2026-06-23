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
  const [notes, setNotes] = useState(token?.notes ?? "");

  useEffect(() => {
    setName(token?.name ?? "");
    setTokenType(token?.tokenType ?? "other");
    setNotes(token?.notes ?? "");
  }, [token]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      sourceItemId: token?.sourceItemId,
      name,
      tokenType,
      notes,
      isHiddenFromPlayers: token?.isHiddenFromPlayers,
    });

    if (!token) {
      setName("");
      setTokenType("other");
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
