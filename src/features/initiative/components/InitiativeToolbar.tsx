import { Button } from "../../../shared/components/Button";

type InitiativeToolbarProps = {
  isFormOpen: boolean;
  onToggleForm: () => void;
  onReset: () => void;
  onSort: () => void;
};

export function InitiativeToolbar({
  isFormOpen,
  onReset,
  onSort,
  onToggleForm,
}: InitiativeToolbarProps) {
  return (
    <div className="initiative-toolbar">
      <Button onClick={onToggleForm}>
        {isFormOpen ? "Fermer le formulaire" : "Ajouter manuellement"}
      </Button>
      <Button onClick={onSort}>Trier</Button>
      <Button onClick={onReset}>Nouveau combat</Button>
    </div>
  );
}
