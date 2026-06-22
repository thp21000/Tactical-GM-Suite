import { useCallback, useEffect, useMemo, useState } from "react";
import type { RangeDistanceUnit, RangeMeasurementMode, RangePreferences, RangeTrackedItem } from "../rangeTypes";
import { createMeasurement } from "../services/rangeGeometry";
import { createRangePreset, defaultRangePresets } from "../services/rangePresets";
import { readRangePreferences, resetRangePreferences, writeRangePreferences } from "../services/rangeStorage";
import type { RangeGridInfo } from "../rangeTypes";

export function useRangeState(gridInfo: RangeGridInfo) {
  const [origin, setOrigin] = useState<RangeTrackedItem | undefined>();
  const [targets, setTargets] = useState<RangeTrackedItem[]>([]);
  const [preferences, setPreferences] = useState<RangePreferences>(() => readRangePreferences());

  useEffect(() => {
    writeRangePreferences(preferences);
  }, [preferences]);

  const measurements = useMemo(() => {
    if (!origin) return [];
    return targets.map((target) => createMeasurement(origin, target, gridInfo, preferences));
  }, [gridInfo, origin, preferences, targets]);

  const addTargets = useCallback((nextTargets: RangeTrackedItem[]) => {
    setTargets((current) => {
      const byId = new Map(current.map((target) => [target.itemId, target]));
      nextTargets.forEach((target) => byId.set(target.itemId, target));
      return [...byId.values()];
    });
  }, []);

  const clearTargets = useCallback(() => setTargets([]), []);
  const clearOrigin = useCallback(() => setOrigin(undefined), []);

  const setMeasurementMode = useCallback((measurementMode: RangeMeasurementMode) => {
    setPreferences((current) => ({ ...current, measurementMode }));
  }, []);

  const setDefaultUnit = useCallback((defaultUnit: RangeDistanceUnit) => {
    setPreferences((current) => ({ ...current, defaultUnit }));
  }, []);

  const setSelectedPresetId = useCallback((selectedPresetId: string) => {
    setPreferences((current) => ({ ...current, selectedPresetId }));
  }, []);

  const addPreset = useCallback((name: string, value: number, unit: RangeDistanceUnit) => {
    const preset = createRangePreset(name, value, unit);
    setPreferences((current) => ({ ...current, selectedPresetId: preset.id, presets: [...current.presets, preset] }));
  }, []);

  const removePreset = useCallback((presetId: string) => {
    setPreferences((current) => {
      const presets = current.presets.filter((preset) => preset.isDefault || preset.id !== presetId);
      return { ...current, presets, selectedPresetId: current.selectedPresetId === presetId ? presets[0]?.id : current.selectedPresetId };
    });
  }, []);

  const resetPresets = useCallback(() => {
    setPreferences((current) => ({ ...current, presets: defaultRangePresets, selectedPresetId: defaultRangePresets[0]?.id }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(resetRangePreferences());
  }, []);

  return { addPreset, addTargets, clearOrigin, clearTargets, measurements, origin, preferences, removePreset, resetPreferences, resetPresets, setDefaultUnit, setMeasurementMode, setOrigin, setSelectedPresetId, targets };
}
