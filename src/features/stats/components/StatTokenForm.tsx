import { FormEvent, useEffect, useMemo, useState } from "react";
import OBR, { type Player } from "@owlbear-rodeo/sdk";
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

function normalizeRoomPlayers(players: Player[]): Player[] {
  const byId = new Map<string, Player>();

  for (const player of players) {
    if (player.role !== "PLAYER") continue;
    byId.set(player.id, player);
  }

  return [...byId.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
  );
}

export function StatTokenForm({ onCancel, onSubmit, token }: Props) {
  const [name, setName] = useState(token?.name ?? "");
  const [tokenType, setTokenType] = useState<StatTokenType>(
    token?.tokenType ?? "other",
  );
  const [assignedPlayerId, setAssignedPlayerId] = useState(
    token?.assignedPlayerId ?? "",
  );
  const [notes, setNotes] = useState(token?.notes ?? "");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);

  useEffect(() => {
    if (!OBR.isAvailable) {
      setRoomPlayers([]);
      setPlayersLoaded(true);
      return undefined;
    }

    let mounted = true;

    const refreshPlayers = async () => {
      try {
        const players = await OBR.party.getPlayers();
        if (!mounted) return;
        setRoomPlayers(normalizeRoomPlayers(players));
      } catch {
        if (mounted) setRoomPlayers([]);
      } finally {
        if (mounted) setPlayersLoaded(true);
      }
    };

    void refreshPlayers();

    const unsubscribe = OBR.party.onChange((players) => {
      if (!mounted) return;
      setRoomPlayers(normalizeRoomPlayers(players));
      setPlayersLoaded(true);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const assignedPlayer = useMemo(
    () => roomPlayers.find((player) => player.id === assignedPlayerId),
    [assignedPlayerId, roomPlayers],
  );

  const savedAssignedPlayerIsOffline = Boolean(
    token?.assignedPlayerId &&
      assignedPlayerId === token.assignedPlayerId &&
      !assignedPlayer,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedPlayerName = assignedPlayerId
      ? assignedPlayer?.name ??
        (assignedPlayerId === token?.assignedPlayerId
          ? token?.assignedPlayerName
          : undefined)
      : undefined;

    onSubmit({
      sourceItemId: token?.sourceItemId,
      name,
      tokenType,
      assignedPlayerId: assignedPlayerId || undefined,
      assignedPlayerName: selectedPlayerName,
      notes,
      isHiddenFromPlayers: token?.isHiddenFromPlayers,
    });

    if (!token) {
      setName("");
      setTokenType("other");
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
        <select
          value={assignedPlayerId}
          onChange={(event) => setAssignedPlayerId(event.target.value)}
        >
          <option value="">Aucun joueur</option>

          {savedAssignedPlayerIsOffline ? (
            <option value={token?.assignedPlayerId}>
              {token?.assignedPlayerName || token?.assignedPlayerId} (hors ligne)
            </option>
          ) : null}

          {roomPlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        {!playersLoaded ? <span className="muted">Chargement des joueurs…</span> : null}
        {playersLoaded && roomPlayers.length === 0 && !savedAssignedPlayerIsOffline ? (
          <span className="muted">Aucun joueur connecté dans la room.</span>
        ) : null}
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
