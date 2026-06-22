import { Button } from "../../../shared/components/Button";
import type { InitiativeParticipant } from "../initiativeTypes";

type InitiativeRoundControlsProps = {
  activeParticipant?: InitiativeParticipant;
  round: number;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
};

export function InitiativeRoundControls({
  activeParticipant,
  onNextTurn,
  onPreviousTurn,
  round,
}: InitiativeRoundControlsProps) {
  return (
    <div className="initiative-round-controls">
      <div>
        <span className="initiative-label">Round</span>
        <strong>{round}</strong>
      </div>
      <div>
        <span className="initiative-label">Tour actif</span>
        <strong>{activeParticipant?.name ?? "Aucun participant"}</strong>
      </div>
      <div className="initiative-round-controls__buttons">
        <Button onClick={onPreviousTurn}>Tour précédent</Button>
        <Button onClick={onNextTurn}>Tour suivant</Button>
      </div>
    </div>
  );
}
