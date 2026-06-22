import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@owlbear-rodeo/sdk";
import type { StatCondition, StatEntity, StatEntityInput, StatResource, StatTrackerState } from "../statTypes";
import { getDangerLevel, getHpPercent } from "../services/statCalculations";
import { addCondition as addConditionToEntity, addResource as addResourceToEntity, createEmptyStatTrackerState, createStatEntity, createStatEntityFromObrItem, removeCondition as removeConditionFromEntity, removeResource as removeResourceFromEntity, setEntityTempHp, toggleEntityDefeated, toggleEntityHidden, updateEntityHp } from "../services/statEntities";
import { readStatTrackerState, resetStatTrackerState, subscribeToStatTrackerState, writeStatTrackerState } from "../services/statStorage";
function touch(state: StatTrackerState): StatTrackerState { return { ...state, updatedAt: new Date().toISOString() }; }
export function useStatTrackerState(isObrReady: boolean) {
  const [state, setState] = useState<StatTrackerState>(() => createEmptyStatTrackerState());
  const hasLoaded = useRef(false);
  useEffect(() => { let mounted = true; readStatTrackerState().then((next) => { if (mounted) { hasLoaded.current = true; setState(next); } }); const unsubscribe = subscribeToStatTrackerState((next) => { hasLoaded.current = true; setState(next); }); return () => { mounted = false; unsubscribe(); }; }, [isObrReady]);
  useEffect(() => { if (hasLoaded.current) void writeStatTrackerState(state); }, [state]);
  const entities = state.entities;
  const addEntity = useCallback((input: StatEntityInput) => setState((current) => touch({ ...current, entities: [...current.entities, createStatEntity(input)] })), []);
  const addItems = useCallback((items: Item[]) => setState((current) => { const existing = new Set(current.entities.map((entity) => entity.sourceItemId).filter(Boolean)); const additions = items.filter((item) => !existing.has(item.id)).map(createStatEntityFromObrItem); return additions.length ? touch({ ...current, entities: [...current.entities, ...additions] }) : current; }), []);
  const updateEntity = useCallback((entityId: string, input: StatEntityInput) => setState((current) => touch({ ...current, entities: current.entities.map((entity) => entity.id === entityId ? { ...entity, ...createStatEntity(input), id: entity.id, sourceItemId: entity.sourceItemId, createdAt: entity.createdAt, updatedAt: new Date().toISOString() } : entity) })), []);
  const removeEntity = useCallback((entityId: string) => setState((current) => touch({ ...current, entities: current.entities.filter((entity) => entity.id !== entityId) })), []);
  const mapEntity = useCallback((entityId: string, update: (entity: StatEntity) => StatEntity) => setState((current) => touch({ ...current, entities: current.entities.map((entity) => entity.id === entityId ? update(entity) : entity) })), []);
  const changeHp = useCallback((entityId: string, delta: number) => mapEntity(entityId, (entity) => updateEntityHp(entity, delta)), [mapEntity]);
  const setTempHp = useCallback((entityId: string, tempHp: number) => mapEntity(entityId, (entity) => setEntityTempHp(entity, tempHp)), [mapEntity]);
  const toggleDefeated = useCallback((entityId: string) => mapEntity(entityId, toggleEntityDefeated), [mapEntity]);
  const toggleHidden = useCallback((entityId: string) => mapEntity(entityId, toggleEntityHidden), [mapEntity]);
  const addCondition = useCallback((entityId: string, condition: StatCondition) => mapEntity(entityId, (entity) => addConditionToEntity(entity, condition)), [mapEntity]);
  const removeCondition = useCallback((entityId: string, conditionId: string) => mapEntity(entityId, (entity) => removeConditionFromEntity(entity, conditionId)), [mapEntity]);
  const addResource = useCallback((entityId: string, resource: StatResource) => mapEntity(entityId, (entity) => addResourceToEntity(entity, resource)), [mapEntity]);
  const removeResource = useCallback((entityId: string, resourceId: string) => mapEntity(entityId, (entity) => removeResourceFromEntity(entity, resourceId)), [mapEntity]);
  const changeResource = useCallback((entityId: string, resourceId: string, delta: number) => mapEntity(entityId, (entity) => ({ ...entity, resources: entity.resources.map((resource) => resource.id === resourceId ? { ...resource, current: Math.max(0, Math.min(resource.max, resource.current + delta)) } : resource), updatedAt: new Date().toISOString() })), [mapEntity]);
  const sortEntities = useCallback(() => setState((current) => touch({ ...current, entities: [...current.entities].sort((a, b) => { if (a.isDefeated !== b.isDefeated) return a.isDefeated ? 1 : -1; const hp = (getHpPercent(a) ?? 101) - (getHpPercent(b) ?? 101); return hp || a.name.localeCompare(b.name, "fr", { sensitivity: "base" }); }) })), []);
  const resetTracker = useCallback(() => { resetStatTrackerState().then(setState); }, []);
  const summary = useMemo(() => ({ total: entities.length, defeated: entities.filter((entity) => getDangerLevel(entity) === "defeated").length, critical: entities.filter((entity) => getDangerLevel(entity) === "critical").length, currentHp: entities.reduce((total, entity) => total + Math.max(entity.currentHp, 0), 0), maxHp: entities.reduce((total, entity) => total + Math.max(entity.maxHp, 0), 0) }), [entities]);
  return { addCondition, addEntity, addItems, addResource, changeHp, changeResource, entities, removeCondition, removeEntity, removeResource, resetTracker, setTempHp, sortEntities, summary, toggleDefeated, toggleHidden, updateEntity };
}
