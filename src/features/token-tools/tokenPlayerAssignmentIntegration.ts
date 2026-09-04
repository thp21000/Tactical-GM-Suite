import type { Item, Player } from "@owlbear-rodeo/sdk";
import {
  readTokenPlayerAssignment,
  writeTokenPlayerAssignment,
  type TokenPlayerAssignment,
} from "../../core/tokens/tokenPlayerAssignment";
import { updateEmbeddedStatToken } from "../stats/services/statEmbeddedProfileActions";
import { readEmbeddedStatToken } from "../stats/services/statTokenSceneLinks";

function now(): string {
  return new Date().toISOString();
}

async function mirrorAssignmentIntoStatProfile(
  itemId: string,
  assignment: TokenPlayerAssignment,
): Promise<void> {
  await updateEmbeddedStatToken(itemId, (token) => ({
    ...token,
    assignedPlayerId: assignment.playerId,
    assignedPlayerName: assignment.playerName,
    updatedAt: now(),
  })).catch(() => undefined);
}

/**
 * Source de vérité : métadonnée Core du token.
 * Le profil Stats reçoit seulement un miroir de compatibilité pour que les
 * permissions Stats existantes continuent à fonctionner sans coupler le Core à Stats.
 */
export async function assignTacticalTokenToPlayer(
  itemId: string,
  player?: Pick<Player, "id" | "name">,
): Promise<TokenPlayerAssignment | undefined> {
  const assignment = await writeTokenPlayerAssignment(itemId, player);
  if (!assignment) return undefined;
  await mirrorAssignmentIntoStatProfile(itemId, assignment);
  return assignment;
}

/** Migre silencieusement une ancienne assignation stockée uniquement dans Stats. */
export async function ensureCoreAssignmentForStatToken(item: Item): Promise<void> {
  if (readTokenPlayerAssignment(item)) return;
  const token = readEmbeddedStatToken(item);
  if (!token) return;

  const assignment = await writeTokenPlayerAssignment(
    item.id,
    token.assignedPlayerId
      ? {
          id: token.assignedPlayerId,
          name: token.assignedPlayerName ?? token.assignedPlayerId,
        }
      : undefined,
  );
  if (assignment) await mirrorAssignmentIntoStatProfile(item.id, assignment);
}
