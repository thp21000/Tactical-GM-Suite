import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../../shared/components/Button";
import { Toggle } from "../../../shared/components/Toggle";
import type { StatTracker, StatTrackerInput, StatTrackerVisibility, StatTrackerVisualType } from "../statTypes";
import { StatTrackerIconPicker } from "./StatTrackerIconPicker";

const VISUAL_TYPES: { value: StatTrackerVisualType; label: string }[] = [
  { value: "icon", label: "Icône seule" },
  { value: "bar", label: "Barre" },
  { value: "counter", label: "Compteur" },
  { value: "readonly", label: "Lecture seule" },
  { value: "toggle", label: "Toggle" },
];
const VISIBILITIES: { value: StatTrackerVisibility; label: string }[] = [
  { value: "gm", label: "MJ" },
  { value: "private", label: "Privé" },
  { value: "public", label: "Public" },
];

type Props = { tracker?: StatTracker; onCancel: () => void; onSubmit: (input: StatTrackerInput) => void };

export function StatTrackerForm({ onCancel, onSubmit, tracker }: Props) {
  const [name, setName] = useState(tracker?.name ?? "");
  const [visualType, setVisualType] = useState<StatTrackerVisualType>(tracker?.visualType ?? "counter");
  const [iconId, setIconId] = useState(tracker?.iconId ?? "counter");
  const [current, setCurrent] = useState(String(tracker?.current ?? 0));
  const [max, setMax] = useState(String(tracker?.max ?? 1));
  const [value, setValue] = useState(String(tracker?.value ?? 0));
  const [enabled, setEnabled] = useState(tracker?.enabled ?? false);
  const [visibility, setVisibility] = useState<StatTrackerVisibility>(tracker?.visibility ?? "gm");
  const [canPlayerEdit, setCanPlayerEdit] = useState(tracker?.canPlayerEdit ?? false);
  const [showOnToken, setShowOnToken] = useState(tracker?.showOnToken ?? false);

  useEffect(() => {
    setName(tracker?.name ?? "");
    setVisualType(tracker?.visualType ?? "counter");
    setIconId(tracker?.iconId ?? "counter");
    setCurrent(String(tracker?.current ?? 0));
    setMax(String(tracker?.max ?? 1));
    setValue(String(tracker?.value ?? 0));
    setEnabled(tracker?.enabled ?? false);
    setVisibility(tracker?.visibility ?? "gm");
    setCanPlayerEdit(tracker?.canPlayerEdit ?? false);
    setShowOnToken(tracker?.showOnToken ?? false);
  }, [tracker]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name,
      visualType,
      iconId,
      current: visualType === "bar" ? Number(current) || 0 : undefined,
      max: visualType === "bar" ? Number(max) || 0 : undefined,
      value: visualType === "counter" || visualType === "readonly" ? Number(value) || 0 : undefined,
      enabled: visualType === "toggle" ? enabled : undefined,
      visibility,
      canPlayerEdit,
      showOnToken,
    });
  }

  return (
    <form className="stat-form stat-tracker-form" onSubmit={submit}>
      <label>Nom<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <label>Type visuel<select value={visualType} onChange={(event) => setVisualType(event.target.value as StatTrackerVisualType)}>{VISUAL_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <div className="stat-form__wide"><span className="stat-form__label">Icône</span><StatTrackerIconPicker value={iconId} onChange={setIconId} /></div>
      {visualType === "bar" ? <><label>Valeur actuelle<input value={current} onChange={(event) => setCurrent(event.target.value)} type="number" /></label><label>Valeur max<input value={max} onChange={(event) => setMax(event.target.value)} type="number" /></label></> : null}
      {visualType === "counter" || visualType === "readonly" ? <label>Valeur<input value={value} onChange={(event) => setValue(event.target.value)} type="number" /></label> : null}
      {visualType === "toggle" ? <label className="stat-toggle-line">État activé<Toggle checked={enabled} label="État activé" onChange={setEnabled} /></label> : null}
      <label>Visibilité<select value={visibility} onChange={(event) => setVisibility(event.target.value as StatTrackerVisibility)}>{VISIBILITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="stat-toggle-line">Modification joueur autorisée<Toggle checked={canPlayerEdit} label="Modification joueur autorisée" onChange={setCanPlayerEdit} /></label>
      <label className="stat-toggle-line">Afficher sur token<Toggle checked={showOnToken} label="Afficher sur token" onChange={setShowOnToken} /></label>
      <div className="stat-form__actions"><Button type="submit">{tracker ? "Enregistrer" : "Ajouter le tracker"}</Button><Button onClick={onCancel}>Annuler</Button></div>
    </form>
  );
}
