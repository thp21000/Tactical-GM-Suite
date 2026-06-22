import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import type {
  InitiativeParticipant,
  InitiativeParticipantInput,
} from "../initiativeTypes";
import { InitiativeParticipantForm } from "./InitiativeParticipantForm";

type InitiativeParticipantCardProps = {
  isCurrentTurn: boolean;
  participant: InitiativeParticipant;
  onRemove: (participantId: string) => void;
  onToggleActive: (participantId: string) => void;
  onToggleDefeated: (participantId: string) => void;
  onToggleHidden: (participantId: string) => void;
  onUpdate: (participantId: string, input: InitiativeParticipantInput) => void;
};

export function InitiativeParticipantCard({
  isCurrentTurn,
  onRemove,
  onToggleActive,
  onToggleDefeated,
  onToggleHidden,
  onUpdate,
  participant,
}: InitiativeParticipantCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <article className="initiative-participant-card">
        <InitiativeParticipantForm
          participant={participant}
          onCancel={() => setIsEditing(false)}
          onSubmit={(input) => {
            onUpdate(participant.id, input);
            setIsEditing(false);
          }}
        />
      </article>
    );
  }

  return (
    <article className="initiative-participant-card">
      <div className="initiative-participant-card__header">
        <div>
          <h3>{participant.name}</h3>
          <span>{participant.type}</span>
        </div>
        <strong>{participant.initiative}</strong>
      </div>

      <div className="initiative-badges">
        {isCurrentTurn ? <Badge tone="warning">tour actif</Badge> : null}
        {!participant.isActive ? <Badge>inactif</Badge> : null}
        {participant.isDefeated ? <Badge tone="danger">vaincu</Badge> : null}
        {participant.isHiddenFromPlayers ? <Badge>masqué</Badge> : null}
        {participant.conditions.map((condition) => (
          <Badge key={condition}>{condition}</Badge>
        ))}
      </div>

      {participant.notes ? (
        <p className="initiative-participant-card__notes">{participant.notes}</p>
      ) : null}

      <div className="initiative-participant-card__actions">
        <Button onClick={() => setIsEditing(true)}>Modifier</Button>
        <Button onClick={() => onToggleActive(participant.id)}>
          {participant.isActive ? "Désactiver" : "Réactiver"}
        </Button>
        <Button onClick={() => onToggleDefeated(participant.id)}>
          {participant.isDefeated ? "Restaurer" : "Marquer vaincu"}
        </Button>
        <Button onClick={() => onToggleHidden(participant.id)}>
          {participant.isHiddenFromPlayers ? "Afficher" : "Masquer"}
        </Button>
        <Button onClick={() => onRemove(participant.id)}>Supprimer</Button>
      </div>
    </article>
  );
}
