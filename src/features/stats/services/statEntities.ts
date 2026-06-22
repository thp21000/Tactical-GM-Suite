import type { Item } from "@owlbear-rodeo/sdk";
import type { StatCondition, StatEntity, StatEntityInput, StatResource, StatTrackerState } from "../statTypes";
import { clampHp } from "./statCalculations";
function createId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function now(): string { return new Date().toISOString(); }
export function createEmptyStatTrackerState(): StatTrackerState { const timestamp = now(); return { id: createId("stat-tracker"), entities: [], createdAt: timestamp, updatedAt: timestamp }; }
export function createStatEntity(input: StatEntityInput): StatEntity { const timestamp = now(); return { id: createId("stat"), sourceItemId: input.sourceItemId, name: input.name.trim() || "Token", type: input.type, armorClass: input.armorClass, maxHp: Math.max(input.maxHp, 0), currentHp: clampHp(input.currentHp, input.maxHp), tempHp: Math.max(input.tempHp, 0), conditions: input.conditions, resources: input.resources, notes: input.notes?.trim() || undefined, isHiddenFromPlayers: false, isDefeated: false, createdAt: timestamp, updatedAt: timestamp }; }
export function createStatEntityFromObrItem(item: Item): StatEntity { return createStatEntity({ sourceItemId: item.id, name: item.name || "Token", type: "unknown", maxHp: 1, currentHp: 1, tempHp: 0, conditions: [], resources: [], notes: "" }); }
export function updateEntityHp(entity: StatEntity, delta: number): StatEntity { return { ...entity, currentHp: clampHp(entity.currentHp + delta, entity.maxHp), updatedAt: now() }; }
export function setEntityTempHp(entity: StatEntity, tempHp: number): StatEntity { return { ...entity, tempHp: Math.max(0, tempHp), updatedAt: now() }; }
export function toggleEntityDefeated(entity: StatEntity): StatEntity { return { ...entity, isDefeated: !entity.isDefeated, currentHp: entity.isDefeated && entity.currentHp <= 0 ? 1 : entity.currentHp, updatedAt: now() }; }
export function toggleEntityHidden(entity: StatEntity): StatEntity { return { ...entity, isHiddenFromPlayers: !entity.isHiddenFromPlayers, updatedAt: now() }; }
export function addCondition(entity: StatEntity, condition: StatCondition): StatEntity { return { ...entity, conditions: [...entity.conditions, condition], updatedAt: now() }; }
export function removeCondition(entity: StatEntity, conditionId: string): StatEntity { return { ...entity, conditions: entity.conditions.filter((condition) => condition.id !== conditionId), updatedAt: now() }; }
export function addResource(entity: StatEntity, resource: StatResource): StatEntity { return { ...entity, resources: [...entity.resources, resource], updatedAt: now() }; }
export function removeResource(entity: StatEntity, resourceId: string): StatEntity { return { ...entity, resources: entity.resources.filter((resource) => resource.id !== resourceId), updatedAt: now() }; }
