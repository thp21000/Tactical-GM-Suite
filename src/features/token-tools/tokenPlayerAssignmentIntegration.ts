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

/**
 * Maintient l'invariant Core -> modules.
 *
 * - ancien profil Stats sans lien Core : migration vers le Core ;
 * - lien Core déjà présent : il gagne toujours et remet à jour le miroir Stats
 *   si un autre chemin vient de créer/modifier le profil.
 */
export async function ensureCoreAssignmentForStatToken(item: Item): Promise<void> {
  const token = readEmbeddedStatToken(item);
  if (!token) return;

  const coreAssignment = readTokenPlayerAssignment(item);
  if (coreAssignment) {
    if (
      token.assignedPlayerId !== coreAssignment.playerId ||
      token.assignedPlayerName !== coreAssignment.playerName
    ) {
      await mirrorAssignmentIntoStatProfile(item.id, coreAssignment);
    }
    return;
  }

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
