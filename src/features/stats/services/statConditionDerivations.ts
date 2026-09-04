import type {
  StatConditionDerivationSource,
  StatTokenCondition,
  StatTrackedToken,
} from "../statTypes";
import type {
  SystemStatConditionDefinition,
  SystemStatConditionImplication,
} from "./statConditionCatalog";

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  return `stat-condition-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sameSource(
  left: StatConditionDerivationSource,
  right: StatConditionDerivationSource,
): boolean {
  return left.conditionId === right.conditionId && left.mode === right.mode;
}

function addSource(
  condition: StatTokenCondition,
  source: StatConditionDerivationSource,
): StatTokenCondition {
  const sources = condition.derivedFrom ?? [];
  if (sources.some((candidate) => sameSource(candidate, source))) return condition;
  return {
    ...condition,
    derivedFrom: [...sources, source],
    updatedAt: now(),
  };
}

function createDerivedCondition(
  implication: SystemStatConditionImplication,
  sourceCondition: StatTokenCondition,
): StatTokenCondition {
  const timestamp = now();
  return {
    id: createId(),
    conditionId: implication.target.id,
    label: implication.target.label,
    shortLabel: implication.target.shortLabel,
    iconId: implication.target.iconId,
    visibility: sourceCondition.visibility ?? "public",
    showOnToken: true,
    tokenDisplayMode: "icon",
    tokenDisplayPriority: 50,
    isExplicit: false,
    derivedFrom: [
      {
        conditionId: sourceCondition.conditionId,
        mode: implication.mode,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function isExplicitStatCondition(condition: StatTokenCondition): boolean {
  return condition.isExplicit !== false;
}

export function getWhileActiveSources(
  condition: StatTokenCondition,
): StatConditionDerivationSource[] {
  return (condition.derivedFrom ?? []).filter((source) => source.mode === "while-active");
}

export function getOnApplySources(
  condition: StatTokenCondition,
): StatConditionDerivationSource[] {
  return (condition.derivedFrom ?? []).filter((source) => source.mode === "on-apply");
}

export function isAutomaticStatCondition(condition: StatTokenCondition): boolean {
  return (condition.derivedFrom?.length ?? 0) > 0;
}

/**
 * Nettoie uniquement les dépendances while-active devenues invalides.
 * Les dépendances on-apply sont historiques : une fois appliquée, la condition
 * secondaire est indépendante et peut survivre à la disparition de sa source.
 */
export function reconcileDerivedConditionList(
  input: StatTokenCondition[],
): StatTokenCondition[] {
  let conditions = input;
  let changed = false;

  for (let pass = 0; pass <= input.length; pass += 1) {
    const activeIds = new Set(conditions.map((condition) => condition.conditionId));
    let passChanged = false;
    const next: StatTokenCondition[] = [];

    for (const condition of conditions) {
      const sources = condition.derivedFrom ?? [];
      const validSources = sources.filter(
        (source) => source.mode === "on-apply" || activeIds.has(source.conditionId),
      );
      const explicit = isExplicitStatCondition(condition);

      if (!explicit && validSources.length === 0) {
        passChanged = true;
        continue;
      }

      if (validSources.length !== sources.length) {
        passChanged = true;
        next.push({
          ...condition,
          derivedFrom: validSources.length > 0 ? validSources : undefined,
          updatedAt: now(),
        });
      } else {
        next.push(condition);
      }
    }

    if (!passChanged) break;
    conditions = next;
    changed = true;
  }

  return changed ? conditions : input;
}

function activateImplications(
  token: StatTrackedToken,
  sourceDefinition: SystemStatConditionDefinition,
  includeOnApply: boolean,
): StatTrackedToken {
  const definitionById = new Map<string, SystemStatConditionDefinition>();
  const stack: Array<{
    definition: SystemStatConditionDefinition;
    includeOnApply: boolean;
  }> = [{ definition: sourceDefinition, includeOnApply }];
  let conditions = token.conditions;
  const expanded = new Set<string>();

  // The target payloads include enough data to create a derived condition. A
  // newly-created target can only recurse when its full definition has already
  // been registered by another implication source. The source itself is always
  // registered here; callers can additionally seed definitions below.
  definitionById.set(sourceDefinition.id, sourceDefinition);

  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) break;
    const expansionKey = `${current.definition.id}:${current.includeOnApply ? "new" : "existing"}`;
    if (expanded.has(expansionKey)) continue;
    expanded.add(expansionKey);

    const sourceCondition = conditions.find(
      (condition) => condition.conditionId === current.definition.id,
    );
    if (!sourceCondition) continue;

    for (const implication of current.definition.implications) {
      if (implication.mode === "on-apply" && !current.includeOnApply) continue;

      const existingIndex = conditions.findIndex(
        (condition) => condition.conditionId === implication.conditionId,
      );
      const source: StatConditionDerivationSource = {
        conditionId: current.definition.id,
        mode: implication.mode,
      };

      if (existingIndex >= 0) {
        // on-apply records provenance only when this application actually
        // created the secondary condition. If it was already active, it was not
        // activated by this source.
        if (implication.mode === "while-active") {
          const existing = conditions[existingIndex];
          const updated = addSource(existing, source);
          if (updated !== existing) {
            conditions = conditions.map((condition, index) =>
              index === existingIndex ? updated : condition,
            );
          }
        }
        continue;
      }

      const created = createDerivedCondition(implication, sourceCondition);
      conditions = [...conditions, created];

      const fullDefinition = definitionById.get(created.conditionId);
      if (fullDefinition) {
        stack.push({ definition: fullDefinition, includeOnApply: true });
      }
    }
  }

  return conditions === token.conditions
    ? token
    : { ...token, conditions, updatedAt: now() };
}

/**
 * Applique les implications d'une condition explicite nouvellement ajoutée.
 * Les relations while-active sont aussi réparées lors d'une édition existante ;
 * les relations on-apply ne sont déclenchées qu'à la première activation.
 */
export function applyStatConditionImplications(
  token: StatTrackedToken,
  definition: SystemStatConditionDefinition,
  newlyActivated: boolean,
): StatTrackedToken {
  return activateImplications(token, definition, newlyActivated);
}

/**
 * Retire une condition explicitement demandée par l'utilisateur.
 *
 * - sans source while-active : suppression complète ;
 * - avec source while-active : seule la part explicite/on-apply est retirée,
 *   la condition reste active automatiquement tant qu'au moins une source
 *   while-active existe.
 */
export function removeExplicitConditionAndReconcile(
  token: StatTrackedToken,
  conditionId: string,
): StatTrackedToken {
  const existing = token.conditions.find((condition) => condition.conditionId === conditionId);
  if (!existing) return token;

  const whileSources = getWhileActiveSources(existing);
  let conditions: StatTokenCondition[];

  if (whileSources.length > 0) {
    const retained: StatTokenCondition = {
      ...existing,
      isExplicit: false,
      derivedFrom: whileSources,
      updatedAt: now(),
    };
    conditions = token.conditions.map((condition) =>
      condition.id === existing.id ? retained : condition,
    );
  } else {
    conditions = token.conditions.filter((condition) => condition.id !== existing.id);
  }

  conditions = reconcileDerivedConditionList(conditions);
  return {
    ...token,
    conditions,
    updatedAt: now(),
  };
}
