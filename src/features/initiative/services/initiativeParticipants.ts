import { DEFAULT_ENCOUNTER_NAME } from "../initiativeConstants";
import type {
  InitiativeEncounterState,
  InitiativeParticipant,
  InitiativeParticipantInput,
} from "../initiativeTypes";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createEmptyEncounter(): InitiativeEncounterState {
  const now = new Date().toISOString();

  return {
    id: createId("encounter"),
    name: DEFAULT_ENCOUNTER_NAME,
    round: 1,
    currentTurnIndex: 0,
    participants: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createParticipant(
  input: InitiativeParticipantInput,
): InitiativeParticipant {
  const now = new Date().toISOString();

  return {
    id: createId("participant"),
    sourceItemId: input.sourceItemId,
    name: input.name.trim() || "Token",
    type: input.type,
    initiative: input.initiative,
    tieBreaker: input.tieBreaker,
    isActive: true,
    isDefeated: false,
    isHiddenFromPlayers: false,
    conditions: input.conditions,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function touchEncounter(
  encounter: InitiativeEncounterState,
): InitiativeEncounterState {
  return { ...encounter, updatedAt: new Date().toISOString() };
}

export function clampTurnIndex(encounter: InitiativeEncounterState): number {
  if (encounter.participants.length === 0) {
    return 0;
  }

  return Math.min(encounter.currentTurnIndex, encounter.participants.length - 1);
}
