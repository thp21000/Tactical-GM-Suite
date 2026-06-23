import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { CollapsibleSection } from "../../../shared/components/CollapsibleSection";
import type { StatDisplayGroup, StatTokenInput, StatTrackerInput } from "../statTypes";
import { StatTokenForm } from "./StatTokenForm";
import { StatTrackerCard } from "./StatTrackerCard";
import { StatTrackerForm } from "./StatTrackerForm";

type Props = {
  group: StatDisplayGroup;
  onAddTracker: (tokenId: string, input: StatTrackerInput) => void;
  onChangeTrackerValue: (tokenId: string, trackerId: string, delta: number) => void;
  onRemoveToken: (tokenId: string) => void;
  onRemoveTracker: (tokenId: string, trackerId: string) => void;
  onToggleTracker: (tokenId: string, trackerId: string) => void;
  onUpdateToken: (tokenId: string, input: Partial<StatTokenInput>) => void;
  onUpdateTracker: (tokenId: string, trackerId: string, input: Partial<StatTrackerInput>) => void;
};

export function StatTrackedTokenBlock({ group, onAddTracker, onChangeTrackerValue, onRemoveToken, onRemoveTracker, onToggleTracker, onUpdateToken, onUpdateTracker }: Props) {
  const trackerCount = group.tokens.reduce((total, token) => total + token.trackers.length, 0);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [addingTrackerTokenId, setAddingTrackerTokenId] = useState<string | null>(null);

  return (
    <CollapsibleSection title={group.name} summary={`${group.tokens.length} token(s) · ${trackerCount} tracker(s)`} defaultOpen={!group.isCollapsed}>
      <div className="stat-token-group">
        {group.tokens.map((token) => (
          <article className="stat-token-block" key={token.id}>
            <div className="stat-token-block__header">
              <div>
                <h3>{token.name}</h3>
                <span>{token.tokenType}{token.sourceItemId ? " · Owlbear" : " · manuel"}</span>
              </div>
              <Badge>{token.isHiddenFromPlayers ? "masqué" : "MJ"}</Badge>
            </div>

            {token.notes ? <p className="stat-notes">{token.notes}</p> : null}

            {editingTokenId === token.id ? (
              <StatTokenForm token={token} onCancel={() => setEditingTokenId(null)} onSubmit={(input) => { onUpdateToken(token.id, input); setEditingTokenId(null); }} />
            ) : null}

            <div className="stat-card__actions">
              <Button onClick={() => setEditingTokenId(token.id)}>Modifier token</Button>
              <Button onClick={() => setAddingTrackerTokenId(addingTrackerTokenId === token.id ? null : token.id)}>Ajouter tracker</Button>
              <Button onClick={() => onRemoveToken(token.id)}>Supprimer token</Button>
            </div>

            {addingTrackerTokenId === token.id ? <StatTrackerForm onCancel={() => setAddingTrackerTokenId(null)} onSubmit={(input) => { onAddTracker(token.id, input); setAddingTrackerTokenId(null); }} /> : null}

            {token.trackers.length === 0 ? <p className="muted">Aucun tracker. Ajoutez PV, CA, munitions ou tout autre suivi utile.</p> : <div className="stat-tracker-list">{token.trackers.map((tracker) => <StatTrackerCard key={tracker.id} tracker={tracker} onChangeValue={(delta) => onChangeTrackerValue(token.id, tracker.id, delta)} onRemove={() => onRemoveTracker(token.id, tracker.id)} onToggle={() => onToggleTracker(token.id, tracker.id)} onUpdate={(input) => onUpdateTracker(token.id, tracker.id, input)} />)}</div>}
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}
