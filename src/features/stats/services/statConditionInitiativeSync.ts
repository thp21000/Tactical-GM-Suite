import OBR from "@owlbear-rodeo/sdk";
import type { InitiativeEncounterState } from "../../initiative/initiativeTypes";
import {
  readInitiativeState,
  subscribeToInitiativeState,
} from "../../initiative/services/initiativeStorage";
import type { StatTokenCondition, StatTrackedToken } from "../statTypes";
import { reconcileDerivedConditionList } from "./statConditionDerivations";
import { writeEmbeddedStatToken } from "./statEmbeddedProfileActions";
import { createOrUpdateTokenConditionOverlay } from "./statConditionOverlayObrSync";
import { readEmbeddedStatToken } from "./statTokenSceneLinks";

function now(): string {
  return new Date().toISOString();
}

function isParticipant(
  encounter: InitiativeEncounterState,
  itemId: string,
): boolean {
  return encounter.participants.some(
    (participant) => participant.sourceItemId === itemId,
  );
}

function reconcileCondition(
  condition: StatTokenCondition,
  encounter: InitiativeEncounterState,
  participant: boolean,
): StatTokenCondition | null {
  if (condition.durationType === "encounter") {
    if (
      condition.initiativeEncounterId &&
      condition.initiativeEncounterId !== encounter.id
    ) {
      return null;
    }

    if (!condition.initiativeEncounterId && participant) {
      return {
        ...condition,
        initiativeEncounterId: encounter.id,
        updatedAt: now(),
      };
    }

    return condition;
  }

  if (condition.durationType !== "rounds") {
    return condition;
  }

  if (
    condition.initiativeEncounterId &&
    condition.initiativeEncounterId !== encounter.id
  ) {
    return null;
  }

  const storedRemaining = Math.max(
    1,
    Math.floor(condition.remainingRounds ?? condition.durationValue ?? 1),
  );

  if (
    !condition.initiativeEncounterId ||
    typeof condition.initiativeExpiresAtRound !== "number"
  ) {
    if (!participant) {
      return condition;
    }

    return {
      ...condition,
      initiativeEncounterId: encounter.id,
      initiativeStartRound: encounter.round,
      initiativeExpiresAtRound: encounter.round + storedRemaining,
      remainingRounds: storedRemaining,
      durationValue: storedRemaining,
      updatedAt: now(),
    };
  }

  const remainingRounds = Math.max(
    0,
    condition.initiativeExpiresAtRound - encounter.round,
  );

  if (remainingRounds <= 0) {
    return null;
  }

  if (condition.remainingRounds === remainingRounds) {
    return condition;
  }

  return {
    ...condition,
    remainingRounds,
    updatedAt: now(),
  };
}

function reconcileToken(
  token: StatTrackedToken,
  encounter: InitiativeEncounterState,
  itemId: string,
): StatTrackedToken | null {
  const participant = isParticipant(encounter, itemId);
  let changed = false;
  const conditions: StatTokenCondition[] = [];

  for (const condition of token.conditions) {
    const next = reconcileCondition(condition, encounter, participant);
    if (!next) {
      changed = true;
      continue;
    }
    if (next !== condition) {
      changed = true;
    }
    conditions.push(next);
  }

  const reconciledConditions = reconcileDerivedConditionList(conditions);
  if (reconciledConditions !== conditions) changed = true;
  if (!changed) return null;

  return {
    ...token,
    conditions: reconciledConditions,
    updatedAt: now(),
  };
}

async function syncEncounterConditions(
  encounter: InitiativeEncounterState,
): Promise<void> {
  try {
    if ((await OBR.player.getRole()) !== "GM") return;
    if (!(await OBR.scene.isReady())) return;

    const items = await OBR.scene.items.getItems();
    for (const item of items) {
      const token = readEmbeddedStatToken(item);
      if (!token || token.conditions.length === 0) continue;

      const updated = reconcileToken(token, encounter, item.id);
      if (!updated) continue;

      const persisted = await writeEmbeddedStatToken(
        item,
        updated,
        updated.isTracked !== false,
      );
      await createOrUpdateTokenConditionOverlay(persisted).catch(() => undefined);
    }
  } catch {
    // La synchronisation des durées ne doit jamais bloquer le background Owlbear.
  }
}

export function setupStatConditionInitiativeSync(): () => void {
  let disposed = false;
  let queue = Promise.resolve();

  const enqueue = (encounter: InitiativeEncounterState) => {
    queue = queue
      .then(async () => {
        if (!disposed) {
          await syncEncounterConditions(encounter);
        }
      })
      .catch(() => undefined);
  };

  void readInitiativeState().then(enqueue).catch(() => undefined);
  const unsubscribe = subscribeToInitiativeState(enqueue);

  return () => {
    disposed = true;
    unsubscribe();
  };
}
