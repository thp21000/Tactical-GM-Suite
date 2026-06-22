import type { InitiativeParticipant } from "../initiativeTypes";

export function sortParticipantsByInitiative(
  participants: InitiativeParticipant[],
): InitiativeParticipant[] {
  return [...participants].sort((left, right) => {
    if (right.initiative !== left.initiative) {
      return right.initiative - left.initiative;
    }

    const leftTieBreaker = left.tieBreaker ?? Number.NEGATIVE_INFINITY;
    const rightTieBreaker = right.tieBreaker ?? Number.NEGATIVE_INFINITY;

    if (rightTieBreaker !== leftTieBreaker) {
      return rightTieBreaker - leftTieBreaker;
    }

    return left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
  });
}
