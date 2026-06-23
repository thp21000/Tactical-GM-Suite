import { Button } from "../../../shared/components/Button";

type Props = { isFormOpen: boolean; onToggleForm: () => void; onReset: () => void };

export function StatTrackerToolbar({ isFormOpen, onReset, onToggleForm }: Props) {
  return (
    <div className="stat-toolbar">
      <Button onClick={onToggleForm}>{isFormOpen ? "Fermer le formulaire" : "Ajouter un token manuellement"}</Button>
      <Button onClick={onReset}>Réinitialiser</Button>
    </div>
  );
}
