import OBR, { type Item, type Player } from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../constants/ids";

export const TOKEN_PLAYER_ASSIGNMENT_METADATA_KEY = `${EXTENSION_ID}/token-player-assignment`;
export const TOKEN_PLAYER_ASSIGNMENT_VERSION = 1;

export type TokenPlayerAssignment = {
  version: typeof TOKEN_PLAYER_ASSIGNMENT_VERSION;
  playerId?: string;
  playerName?: string;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function readTokenPlayerAssignment(
  item: Pick<Item, "metadata">,
): TokenPlayerAssignment | undefined {
  const value = item.metadata?.[TOKEN_PLAYER_ASSIGNMENT_METADATA_KEY];
  if (!isRecord(value) || value.version !== TOKEN_PLAYER_ASSIGNMENT_VERSION) {
    return undefined;
  }

  const assignment: TokenPlayerAssignment = {
    version: TOKEN_PLAYER_ASSIGNMENT_VERSION,
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
  const playerId = cleanOptionalText(value.playerId);
  const playerName = cleanOptionalText(value.playerName);
  if (playerId) assignment.playerId = playerId;
  if (playerName) assignment.playerName = playerName;
  return assignment;
}

export function createTokenPlayerAssignment(
  player?: Pick<Player, "id" | "name">,
): TokenPlayerAssignment {
  const assignment: TokenPlayerAssignment = {
    version: TOKEN_PLAYER_ASSIGNMENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const playerId = cleanOptionalText(player?.id);
  const playerName = cleanOptionalText(player?.name);
  if (playerId) assignment.playerId = playerId;
  if (playerName) assignment.playerName = playerName;
  return assignment;
}

/**
 * Écrit l'assignation directement sur le token Owlbear.
 *
 * Même l'état « aucune personne » est persisté explicitement via version +
 * updatedAt, sans propriétés undefined, afin qu'un ancien snapshot de module
 * ne puisse pas réintroduire une assignation supprimée.
 */
export async function writeTokenPlayerAssignment(
  itemId: string,
  player?: Pick<Player, "id" | "name">,
): Promise<TokenPlayerAssignment | undefined> {
  const assignment = createTokenPlayerAssignment(player);
  let updated = false;

  await OBR.scene.items.updateItems([itemId], (drafts) => {
    const [draft] = drafts;
    if (!draft) return;
    draft.metadata[TOKEN_PLAYER_ASSIGNMENT_METADATA_KEY] = assignment;
    updated = true;
  });

  return updated ? assignment : undefined;
}

export function isTokenAssignedToPlayerId(
  item: Pick<Item, "metadata">,
  playerId: string,
): boolean {
  return readTokenPlayerAssignment(item)?.playerId === playerId;
}
