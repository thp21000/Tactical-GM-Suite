export type StatEntityType = "pc" | "npc" | "creature" | "hazard" | "object" | "unknown";
export type StatDangerLevel = "safe" | "hurt" | "bloodied" | "critical" | "defeated" | "unknown";
export type StatResource = { id: string; name: string; current: number; max: number; colorLabel?: string };
export type StatCondition = { id: string; name: string; value?: number; note?: string };
export type StatEntity = { id: string; sourceItemId?: string; name: string; type: StatEntityType; armorClass?: number; maxHp: number; currentHp: number; tempHp: number; shieldHp?: number; conditions: StatCondition[]; resources: StatResource[]; notes?: string; isHiddenFromPlayers: boolean; isDefeated: boolean; createdAt: string; updatedAt: string };
export type StatTrackerState = { id: string; entities: StatEntity[]; selectedEntityId?: string; createdAt: string; updatedAt: string };
export type StatEntityInput = { sourceItemId?: string; name: string; type: StatEntityType; armorClass?: number; maxHp: number; currentHp: number; tempHp: number; conditions: StatCondition[]; resources: StatResource[]; notes?: string };
