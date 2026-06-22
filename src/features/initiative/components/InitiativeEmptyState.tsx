import { EmptyState } from "../../../shared/components/EmptyState";

export function InitiativeEmptyState() {
  return (
    <EmptyState
      title="Aucun participant"
      message="Ajoutez un participant manuellement ou depuis le menu contextuel Owlbear."
    />
  );
}
