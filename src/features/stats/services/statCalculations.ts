import type { StatDangerLevel, StatEntity } from "../statTypes";
export function clampHp(value: number, maxHp: number): number { return Math.max(0, Math.min(value, Math.max(maxHp, 0))); }
export function getHpPercent(entity: StatEntity): number | undefined { if (entity.maxHp <= 0) return undefined; return Math.max(0, Math.min(100, (entity.currentHp / entity.maxHp) * 100)); }
export function getDangerLevel(entity: StatEntity): StatDangerLevel { const percent = getHpPercent(entity); if (entity.isDefeated || entity.currentHp <= 0) return "defeated"; if (percent === undefined) return "unknown"; if (percent <= 25) return "critical"; if (percent <= 50) return "bloodied"; if (percent < 100) return "hurt"; return "safe"; }
export function getTotalCurrentHp(entities: StatEntity[]): number { return entities.reduce((total, entity) => total + Math.max(entity.currentHp, 0), 0); }
export function getTotalMaxHp(entities: StatEntity[]): number { return entities.reduce((total, entity) => total + Math.max(entity.maxHp, 0), 0); }
export function getDefeatedCount(entities: StatEntity[]): number { return entities.filter((entity) => getDangerLevel(entity) === "defeated").length; }
export function getCriticalCount(entities: StatEntity[]): number { return entities.filter((entity) => getDangerLevel(entity) === "critical").length; }
