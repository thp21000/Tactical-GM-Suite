import type { ObrReadyState } from "../../core/obr/obrReady";
import { Badge } from "../../shared/components/Badge";
import { Panel } from "../../shared/components/Panel";
import { InitiativeEmptyState } from "./components/InitiativeEmptyState";
import { InitiativeParticipantCard } from "./components/InitiativeParticipantCard";
import { InitiativeParticipantForm } from "./components/InitiativeParticipantForm";
import { InitiativeRoundControls } from "./components/InitiativeRoundControls";
import { InitiativeToolbar } from "./components/InitiativeToolbar";
import { useInitiativeContextMenu } from "./hooks/useInitiativeContextMenu";
import { useInitiativeState } from "./hooks/useInitiativeState";
import { useState } from "react";

type InitiativePageProps = {
  obr: ObrReadyState;
};

export function InitiativePage({ obr }: InitiativePageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {
    activeParticipant,
    addItemsFromOwlbear,
    addParticipant,
    encounter,
    goToNextTurn,
    goToPreviousTurn,
    removeParticipant,
    resetEncounter,
    sortParticipants,
    toggleDefeated,
    toggleHidden,
    updateParticipant,
  } = useInitiativeState(obr.isReady);

  useInitiativeContextMenu({
    isReady: obr.isReady,
    onAddItems: addItemsFromOwlbear,
  });

  return (
    <div className="stack initiative-page">
      <Panel>
        <div className="initiative-header">
          <div>
            <p className="eyebrow">Bloc actif</p>
            <h1>Initiative Tracker</h1>
            <p>{encounter.name}</p>
          </div>
          <Badge tone={obr.isReady ? "success" : "warning"}>{obr.modeLabel}</Badge>
        </div>
      </Panel>

      <Panel>
        <InitiativeRoundControls
          activeParticipant={activeParticipant}
          round={encounter.round}
          onNextTurn={goToNextTurn}
          onPreviousTurn={goToPreviousTurn}
        />
      </Panel>

      <Panel>
        <InitiativeToolbar
          isFormOpen={isFormOpen}
          onReset={resetEncounter}
          onSort={sortParticipants}
          onToggleForm={() => setIsFormOpen((current) => !current)}
        />
        {isFormOpen ? (
          <InitiativeParticipantForm
            onSubmit={(input) => {
              addParticipant(input);
              setIsFormOpen(false);
            }}
          />
        ) : null}
      </Panel>

      <Panel title="Participants">
        {encounter.participants.length === 0 ? (
          <InitiativeEmptyState />
        ) : (
          <div className="initiative-list">
            {encounter.participants.map((participant, index) => (
              <InitiativeParticipantCard
                key={participant.id}
                isCurrentTurn={index === encounter.currentTurnIndex}
                participant={participant}
                onRemove={removeParticipant}
                onToggleDefeated={toggleDefeated}
                onToggleHidden={toggleHidden}
                onUpdate={updateParticipant}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
