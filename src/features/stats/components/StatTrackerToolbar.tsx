import { Button } from "../../../shared/components/Button";
type Props = { isFormOpen: boolean; onToggleForm: () => void; onReset: () => void; onSort: () => void };
export function StatTrackerToolbar({ isFormOpen, onReset, onSort, onToggleForm }: Props) { return <div className="stat-toolbar"><Button onClick={onToggleForm}>{isFormOpen ? "Fermer le formulaire" : "Ajouter manuellement"}</Button><Button onClick={onSort}>Trier</Button><Button onClick={onReset}>Réinitialiser le tracker</Button></div>; }
