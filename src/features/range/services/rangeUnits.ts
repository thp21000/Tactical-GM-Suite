import type { ParsedGridScale, RangeDistanceUnit, RangeMeasurement } from "../rangeTypes";

export function parseGridScale(rawScale?: string): ParsedGridScale {
  const raw = rawScale ?? "";
  const match = raw.trim().toLowerCase().replace(",", ".").match(/^([0-9]+(?:\.[0-9]+)?)\s*(ft|feet|m|meter|meters|metres|mètres)$/);
  if (!match) return { raw, unit: "unknown", value: 1 };
  const value = Number(match[1]);
  const unit = match[2].startsWith("m") ? "meters" : "feet";
  return { raw, unit, value: Number.isFinite(value) && value > 0 ? value : 1 };
}

export function convertGridToFeet(distanceGrid: number, scale: ParsedGridScale): number | undefined {
  return scale.unit === "feet" ? distanceGrid * scale.value : undefined;
}

export function convertGridToMeters(distanceGrid: number, scale: ParsedGridScale): number | undefined {
  return scale.unit === "meters" ? distanceGrid * scale.value : undefined;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatDistance(measurement: RangeMeasurement, unit: RangeDistanceUnit): string {
  if (unit === "feet" && measurement.distanceFeet !== undefined) return `${formatNumber(measurement.distanceFeet)} ft`;
  if (unit === "meters" && measurement.distanceMeters !== undefined) return `${formatNumber(measurement.distanceMeters)} m`;
  if (unit === "pixels") return `${formatNumber(measurement.distancePixels)} px`;
  return `${formatNumber(measurement.distanceGrid)} cases (${formatNumber(measurement.distancePixels)} px)`;
}
