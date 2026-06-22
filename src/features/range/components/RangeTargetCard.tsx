import { Badge } from "../../../shared/components/Badge";
import type { RangeDistanceUnit, RangeMeasurement } from "../rangeTypes";
import { formatDistance } from "../services/rangeUnits";

type Props = { measurement: RangeMeasurement; unit: RangeDistanceUnit };

export function RangeTargetCard({ measurement, unit }: Props) {
  const tone = measurement.status === "in-range" ? "success" : measurement.status === "out-of-range" ? "danger" : "warning";
  const label = measurement.status === "in-range" ? "dans la portée" : measurement.status === "out-of-range" ? "hors portée" : "portée inconnue";
  return <article className="range-target-card"><div><h3>{measurement.target.name}</h3><p>{formatDistance(measurement, unit)}</p></div><Badge tone={tone}>{label}</Badge></article>;
}
