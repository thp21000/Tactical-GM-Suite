import clsx from "clsx";

type ToggleProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function Toggle({ checked, disabled, label, onChange }: ToggleProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={checked}
      className={clsx("toggle", checked && "toggle--checked")}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span />
    </button>
  );
}
