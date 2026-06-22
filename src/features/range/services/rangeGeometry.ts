import type { BoundingBox } from "@owlbear-rodeo/sdk";
import type { RangeGridInfo, RangeMeasurement, RangePreferences, RangeTrackedItem } from "../rangeTypes";
import { convertGridToFeet, convertGridToMeters, parseGridScale } from "./rangeUnits";

type Point = { x: number; y: number };

type SimpleBounds = NonNullable<RangeTrackedItem["bounds"]>;

export function getBoundsCenter(bounds: SimpleBounds | BoundingBox): Point {
  if ("center" in bounds) return { x: bounds.center.x, y: bounds.center.y };
  return { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height / 2 };
}

export function normalizeObrBounds(bounds: BoundingBox): SimpleBounds {
  return { minX: bounds.min.x, minY: bounds.min.y, maxX: bounds.max.x, maxY: bounds.max.y, width: bounds.width, height: bounds.height };
}

export function getDistancePixels(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getEdgeToEdgeDistancePixels(originBounds?: SimpleBounds, targetBounds?: SimpleBounds): number {
  if (!originBounds || !targetBounds) return 0;
  const dx = Math.max(0, targetBounds.minX - originBounds.maxX, originBounds.minX - targetBounds.maxX);
  const dy = Math.max(0, targetBounds.minY - originBounds.maxY, originBounds.minY - targetBounds.maxY);
  return Math.hypot(dx, dy);
}

function convertPresetToGrid(value: number, unit: string, scaleRaw?: string): number | undefined {
  if (unit === "grid") return value;
  const scale = parseGridScale(scaleRaw);
  if (unit === "feet" && scale.unit === "feet") return value / scale.value;
  if (unit === "meters" && scale.unit === "meters") return value / scale.value;
  return undefined;
}

export function createMeasurement(origin: RangeTrackedItem, target: RangeTrackedItem, gridInfo: RangeGridInfo, preferences: RangePreferences): RangeMeasurement {
  const distancePixels = preferences.measurementMode === "edge-to-edge" && origin.bounds && target.bounds ? getEdgeToEdgeDistancePixels(origin.bounds, target.bounds) : getDistancePixels(origin.center, target.center);
  const distanceGrid = gridInfo.dpi && gridInfo.dpi > 0 ? distancePixels / gridInfo.dpi : distancePixels;
  const scale = parseGridScale(gridInfo.rawScale);
  const preset = preferences.presets.find((item) => item.id === preferences.selectedPresetId);
  const presetGrid = preset ? convertPresetToGrid(preset.value, preset.unit, gridInfo.rawScale) : undefined;
  const status = presetGrid === undefined ? "unknown" : distanceGrid <= presetGrid ? "in-range" : "out-of-range";
  return { id: `${origin.itemId}-${target.itemId}`, origin, target, distancePixels, distanceGrid, distanceFeet: convertGridToFeet(distanceGrid, scale), distanceMeters: convertGridToMeters(distanceGrid, scale), selectedPresetId: preferences.selectedPresetId, status };
}
