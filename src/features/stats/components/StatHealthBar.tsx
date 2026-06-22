import { getDangerLevel, getHpPercent } from "../services/statCalculations";
import type { StatEntity } from "../statTypes";
type Props = { entity: StatEntity };
export function StatHealthBar({ entity }: Props) { const percent = getHpPercent(entity); const danger = getDangerLevel(entity); return <div className={`stat-health stat-health--${danger}`}><div className="stat-health__meta"><span>{percent === undefined ? "PV inconnus" : `${entity.currentHp}/${entity.maxHp} PV`}</span>{entity.tempHp > 0 ? <span>Temp {entity.tempHp}</span> : null}</div><div className="stat-health__track"><span style={{ width: `${percent ?? 0}%` }} /></div></div>; }
