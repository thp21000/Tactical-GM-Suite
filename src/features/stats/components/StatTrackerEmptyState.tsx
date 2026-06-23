import { EmptyState } from "../../../shared/components/EmptyState";

export function StatTrackerEmptyState() {
  return <EmptyState title="Aucun token suivi" message={'Ajoutez un token manuellement ou depuis le menu contextuel Owlbear "Add to Stat Tracker".'} />;
}
