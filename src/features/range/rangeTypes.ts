export type RangeMeasurementMode = "center-to-center" | "edge-to-edge";

export type RangeDistanceUnit = "grid" | "feet" | "meters" | "pixels";

export type RangeStatus = "in-range" | "out-of-range" | "unknown";

export type RangePreset = {
  id: string;
  name: string;
  value: number;
  unit: RangeDistanceUnit;
  colorLabel?: string;
  isDefault: boolean;
};

export type RangeTrackedItem = {
  id: string;
  name: string;
  itemId: string;
  center: { x: number; y: number };
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
};

export type RangeMeasurement = {
  id: string;
  origin: RangeTrackedItem;
  target: RangeTrackedItem;
  distancePixels: number;
  distanceGrid: number;
  distanceFeet?: number;
  distanceMeters?: number;
  selectedPresetId?: string;
  status: RangeStatus;
};

export type RangePreferences = {
  measurementMode: RangeMeasurementMode;
  defaultUnit: RangeDistanceUnit;
  selectedPresetId?: string;
  presets: RangePreset[];
};

export type RangeGridInfo = {
  dpi?: number;
  rawScale?: string;
};

export type ParsedGridScale = {
  unit: "feet" | "meters" | "unknown";
  value: number;
  raw: string;
};
