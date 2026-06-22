import { moduleRegistry } from "./moduleRegistry";

export type ModuleStateMap = Record<string, boolean>;

export function createDefaultModuleStates(): ModuleStateMap {
  return Object.fromEntries(moduleRegistry.map((module) => [module.id, module.enabledByDefault]));
}

export function normalizeModuleStates(states?: Partial<ModuleStateMap>): ModuleStateMap {
  return Object.fromEntries(moduleRegistry.map((module) => [module.id, module.canDisable ? states?.[module.id] ?? module.enabledByDefault : true]));
}

export function countEnabledModules(states: ModuleStateMap): number {
  return moduleRegistry.filter((module) => states[module.id]).length;
}
