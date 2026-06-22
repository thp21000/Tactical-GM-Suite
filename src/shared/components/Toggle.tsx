import clsx from "clsx";
export function Toggle({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void; label: string }) { return <button type="button" className={clsx("toggle", checked && "toggle--checked")} disabled={disabled} onClick={() => onChange(!checked)} aria-pressed={checked} aria-label={label}><span /></button>; }
