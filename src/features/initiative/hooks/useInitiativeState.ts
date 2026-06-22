import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@owlbear-rodeo/sdk";
import type {
  InitiativeEncounterState,
  InitiativeParticipant,
  InitiativeParticipantInput,
} from "../initiativeTypes";
import { createEmptyEncounter, createParticipant, touchEncounter } from "../services/initiativeParticipants";
import {
  readInitiativeState,
  resetInitiativeState,
  subscribeToInitiativeState,
  writeInitiativeState,
} from "../services/initiativeStorage";
import { sortParticipantsByInitiative } from "../services/initiativeSorting";

function getNextActiveIndex(
  participants: InitiativeParticipant[],
  startIndex: number,
): number {
  if (participants.length === 0) {
    return 0;
  }

  for (let offset = 1; offset <= participants.length; offset += 1) {
    const index = (startIndex + offset) % participants.length;

    if (participants[index]?.isActive) {
      return index;
    }
  }

  return startIndex;
}

function getPreviousActiveIndex(
  participants: InitiativeParticipant[],
  startIndex: number,
): number {
  if (participants.length === 0) {
    return 0;
  }

  for (let offset = 1; offset <= participants.length; offset += 1) {
    const index =
      (startIndex - offset + participants.length) % participants.length;

    if (participants[index]?.isActive) {
      return index;
    }
  }

  return startIndex;
}

export function useInitiativeState(isObrReady: boolean) {
  const [encounter, setEncounter] = useState<InitiativeEncounterState>(() =>
    createEmptyEncounter(),
  );
  const hasLoaded = useRef(false);

  useEffect(() => {
    let mounted = true;

    readInitiativeState().then((state) => {
      if (!mounted) {
        return;
      }

      hasLoaded.current = true;
      setEncounter(state);
    });

    const unsubscribe = subscribeToInitiativeState((state) => {
      hasLoaded.current = true;
      setEncounter(state);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isObrReady]);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    void writeInitiativeState(encounter);
  }, [encounter]);

  const activeParticipant = useMemo(
    () => encounter.participants[encounter.currentTurnIndex],
    [encounter.currentTurnIndex, encounter.participants],
  );

  const addParticipant = useCallback((input: InitiativeParticipantInput) => {
    setEncounter((current) =>
      touchEncounter({
        ...current,
        participants: [...current.participants, createParticipant(input)],
      }),
    );
  }, []);

  const addItemsFromOwlbear = useCallback((items: Item[]) => {
    setEncounter((current) => {
      const existingSourceIds = new Set(
        current.participants
          .map((participant) => participant.sourceItemId)
          .filter(Boolean),
      );
      const participantsToAdd = items
        .filter((item) => !existingSourceIds.has(item.id))
        .map((item) =>
          createParticipant({
            sourceItemId: item.id,
            name: item.name || "Token",
            type: "unknown",
            initiative: 0,
            conditions: [],
          }),
        );

      if (participantsToAdd.length === 0) {
        return current;
      }

      return touchEncounter({
        ...current,
        participants: [...current.participants, ...participantsToAdd],
      });
    });
  }, []);

  const updateParticipant = useCallback(
    (participantId: string, input: InitiativeParticipantInput) => {
      setEncounter((current) =>
        touchEncounter({
          ...current,
          participants: current.participants.map((participant) =>
            participant.id === participantId
              ? {
                  ...participant,
                  ...input,
                  name: input.name.trim() || "Token",
                  notes: input.notes?.trim() || undefined,
                  updatedAt: new Date().toISOString(),
                }
              : participant,
          ),
        }),
      );
    },
    [],
  );

  const removeParticipant = useCallback((participantId: string) => {
    setEncounter((current) => {
      const participants = current.participants.filter(
        (participant) => participant.id !== participantId,
      );
      const currentTurnIndex = Math.min(
        current.currentTurnIndex,
        Math.max(participants.length - 1, 0),
      );

      return touchEncounter({ ...current, participants, currentTurnIndex });
    });
  }, []);

  const toggleDefeated = useCallback((participantId: string) => {
    setEncounter((current) =>
      touchEncounter({
        ...current,
        participants: current.participants.map((participant) =>
          participant.id === participantId
            ? {
                ...participant,
                isDefeated: !participant.isDefeated,
                updatedAt: new Date().toISOString(),
              }
            : participant,
        ),
      }),
    );
  }, []);

  const toggleHidden = useCallback((participantId: string) => {
    setEncounter((current) =>
      touchEncounter({
        ...current,
        participants: current.participants.map((participant) =>
          participant.id === participantId
            ? {
                ...participant,
                isHiddenFromPlayers: !participant.isHiddenFromPlayers,
                updatedAt: new Date().toISOString(),
              }
            : participant,
        ),
      }),
    );
  }, []);

  const sortParticipants = useCallback(() => {
    setEncounter((current) =>
      touchEncounter({
        ...current,
        participants: sortParticipantsByInitiative(current.participants),
        currentTurnIndex: 0,
      }),
    );
  }, []);

  const goToNextTurn = useCallback(() => {
    setEncounter((current) => {
      const nextIndex = getNextActiveIndex(
        current.participants,
        current.currentTurnIndex,
      );
      const didWrap =
        current.participants.length > 0 && nextIndex <= current.currentTurnIndex;

      return touchEncounter({
        ...current,
        currentTurnIndex: nextIndex,
        round: didWrap ? current.round + 1 : current.round,
      });
    });
  }, []);

  const goToPreviousTurn = useCallback(() => {
    setEncounter((current) => {
      const previousIndex = getPreviousActiveIndex(
        current.participants,
        current.currentTurnIndex,
      );
      const didWrap =
        current.participants.length > 0 && previousIndex >= current.currentTurnIndex;

      return touchEncounter({
        ...current,
        currentTurnIndex: previousIndex,
        round: didWrap ? Math.max(1, current.round - 1) : current.round,
      });
    });
  }, []);

  const resetEncounter = useCallback(() => {
    resetInitiativeState().then((state) => {
      setEncounter(state);
    });
  }, []);

  return {
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
  };
}
