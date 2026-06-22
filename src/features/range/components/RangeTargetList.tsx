import type { RangeDistanceUnit, RangeMeasurement } from "../rangeTypes";
import { RangeEmptyState } from "./RangeEmptyState";
import { RangeTargetCard } from "./RangeTargetCard";

type Props = { measurements: RangeMeasurement[]; unit: RangeDistanceUnit };

export function RangeTargetList({ measurements, unit }: Props) {
  if (measurements.length === 0) return <RangeEmptyState />;
  return <div className="range-target-list">{measurements.map((measurement) => <RangeTargetCard key={measurement.id} measurement={measurement} unit={unit} />)}</div>;
}
