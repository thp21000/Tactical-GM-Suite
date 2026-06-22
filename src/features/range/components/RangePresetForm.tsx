import { FormEvent, useState } from "react";
import { Button } from "../../../shared/components/Button";
import type { RangeDistanceUnit, RangePreset } from "../rangeTypes";

type Props = { presets: RangePreset[]; onAddPreset: (name: string, value: number, unit: RangeDistanceUnit) => void; onRemovePreset: (presetId: string) => void; onResetPresets: () => void };

export function RangePresetForm({ onAddPreset, onRemovePreset, onResetPresets, presets }: Props) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState<RangeDistanceUnit>("grid");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onAddPreset(name, Number(value) || 1, unit); setName(""); setValue("1"); setUnit("grid"); }
  return <div className="range-presets"><form className="range-preset-form" onSubmit={submit}><label>Nom<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Valeur<input value={value} onChange={(event) => setValue(event.target.value)} type="number" min="0" step="0.5" /></label><label>Unité<select value={unit} onChange={(event) => setUnit(event.target.value as RangeDistanceUnit)}><option value="grid">Cases</option><option value="feet">Feet</option><option value="meters">Mètres</option><option value="pixels">Pixels</option></select></label><Button type="submit">Ajouter preset</Button></form><div className="range-preset-list">{presets.map((preset) => <div key={preset.id}><span>{preset.name} · {preset.value} {preset.unit}</span>{preset.isDefault ? null : <Button onClick={() => onRemovePreset(preset.id)}>Supprimer</Button>}</div>)}</div><Button onClick={onResetPresets}>Réinitialiser les presets</Button></div>;
}
