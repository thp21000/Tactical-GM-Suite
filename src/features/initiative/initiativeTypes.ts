export type InitiativeParticipantType =
  | "pc"
  | "npc"
  | "creature"
  | "hazard"
  | "unknown";

export type InitiativeParticipant = {
  id: string;
  sourceItemId?: string;
  name: string;
  type: InitiativeParticipantType;
  initiative: number;
  tieBreaker?: number;
  isActive: boolean;
  isDefeated: boolean;
  isHiddenFromPlayers: boolean;
  conditions: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type InitiativeEncounterState = {
  id: string;
  name: string;
  round: number;
  currentTurnIndex: number;
  participants: InitiativeParticipant[];
  createdAt: string;
  updatedAt: string;
};

export type InitiativeParticipantInput = {
  name: string;
  type: InitiativeParticipantType;
  initiative: number;
  tieBreaker?: number;
  conditions: string[];
  notes?: string;
  sourceItemId?: string;
};
