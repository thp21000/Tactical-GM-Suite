import { Button } from "../../../shared/components/Button";
import type { RangeDistanceUnit, RangeMeasurementMode, RangePreset } from "../rangeTypes";

type Props = {
  mode: RangeMeasurementMode;
  unit: RangeDistanceUnit;
  presets: RangePreset[];
  selectedPresetId?: string;
  onClearOrigin: () => void;
  onClearTargets: () => void;
  onRefresh: () => void;
  onModeChange: (mode: RangeMeasurementMode) => void;
  onUnitChange: (unit: RangeDistanceUnit) => void;
  onPresetChange: (presetId: string) => void;
};

export function RangeToolbar({ mode, onClearOrigin, onClearTargets, onModeChange, onPresetChange, onRefresh, onUnitChange, presets, selectedPresetId, unit }: Props) {
  return <div className="range-toolbar"><Button onClick={onClearOrigin}>Effacer origine</Button><Button onClick={onClearTargets}>Effacer cibles</Button><Button onClick={onRefresh}>Rafraîchir depuis la scène</Button><label>Mode<select value={mode} onChange={(event) => onModeChange(event.target.value as RangeMeasurementMode)}><option value="center-to-center">Centre à centre</option><option value="edge-to-edge">Bord à bord</option></select></label><label>Unité<select value={unit} onChange={(event) => onUnitChange(event.target.value as RangeDistanceUnit)}><option value="grid">Cases</option><option value="feet">Feet</option><option value="meters">Mètres</option><option value="pixels">Pixels</option></select></label><label>Preset<select value={selectedPresetId ?? ""} onChange={(event) => onPresetChange(event.target.value)}>{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label></div>;
}
