import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { CollapsibleSection } from "../../../shared/components/CollapsibleSection";
import { STAT_TOKEN_TYPE_LABELS } from "../services/statLabels";
import type { StatTokenConditionInput } from "../services/statConditions";
import { canViewerEditTracker, type StatPermissionViewer } from "../services/statPermissions";
import type {
  StatDisplayGroup,
  StatTokenInput,
  StatTrackerInput,
} from "../statTypes";
import { StatConditionList } from "./StatConditionList";
import { StatTokenForm } from "./StatTokenForm";
import { StatTrackerCard } from "./StatTrackerCard";
import { StatTrackerForm } from "./StatTrackerForm";

type Props = {
  group: StatDisplayGroup;
  isGm: boolean;
  viewer: StatPermissionViewer;
  onAddCondition: (tokenId: string, conditionId: string, value?: number) => void;
  onClearConditionDuration: (tokenId: string, tokenConditionId: string) => void;
  onAddTracker: (tokenId: string, input: StatTrackerInput) => void;
  onApplyPreset: (tokenId: string) => void;
  onChangeTrackerValue: (tokenId: string, trackerId: string, delta: number) => void;
  onDecrementConditionDuration: (tokenId: string, tokenConditionId: string) => void;
  onRemoveCondition: (tokenId: string, tokenConditionId: string) => void;
  onRemoveToken: (tokenId: string) => void;
  onRemoveTracker: (tokenId: string, trackerId: string) => void;
  onToggleTracker: (tokenId: string, trackerId: string) => void;
  onUpdateCondition: (
    tokenId: string,
    tokenConditionId: string,
    input: StatTokenConditionInput,
  ) => void;
  onUpdateToken: (tokenId: string, input: Partial<StatTokenInput>) => void;
  onUpdateTracker: (
    tokenId: string,
    trackerId: string,
    input: Partial<StatTrackerInput>,
  ) => void;
};

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value > 1 ? plural : singular}`;
}

function getPlayerAssignmentLabel(token: {
  assignedPlayerId?: string;
  assignedPlayerName?: string;
}): string | null {
  if (token.assignedPlayerName) {
    return token.assignedPlayerName;
  }

  if (token.assignedPlayerId) {
    return token.assignedPlayerId;
  }

  return null;
}

export function StatTrackedTokenBlock({
  group,
  isGm,
  viewer,
  onAddCondition,
  onClearConditionDuration,
  onAddTracker,
  onApplyPreset,
  onChangeTrackerValue,
  onDecrementConditionDuration,
  onRemoveCondition,
  onRemoveToken,
  onRemoveTracker,
  onToggleTracker,
  onUpdateCondition,
  onUpdateToken,
  onUpdateTracker,
}: Props) {
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [addingTrackerTokenId, setAddingTrackerTokenId] = useState<string | null>(
    null,
  );

  const trackerCount = group.tokens.reduce(
    (total, token) => total + token.trackers.length,
    0,
  );

  const summary = [
    formatCount(group.tokens.length, "token", "tokens"),
    formatCount(trackerCount, "tracker", "trackers"),
  ].join(" · ");

  return (
    <CollapsibleSection
      title={group.name}
      summary={summary}
      defaultOpen={!group.isCollapsed}
    >
      <div className="stat-token-group">
        {group.isGroup ? <Badge>Groupe lié</Badge> : null}

        {group.tokens.map((token) => {
          const tokenTypeLabel = STAT_TOKEN_TYPE_LABELS[token.tokenType];
          const sourceLabel = token.sourceItemId ? "Owlbear" : "Manuel";
          const playerAssignmentLabel = getPlayerAssignmentLabel(token);
          const isEditing = editingTokenId === token.id;
          const isAddingTracker = addingTrackerTokenId === token.id;

          return (
            <article className="stat-token-block" key={token.id}>
              <div className="stat-token-block__header">
                <div>
                  <h3>{token.name}</h3>
                  <span>
                    {tokenTypeLabel} · {sourceLabel}
                    {playerAssignmentLabel
                      ? ` · Assigné à ${playerAssignmentLabel}`
                      : ""}
                  </span>
                </div>

                <div className="stat-token-block__badges">
                  {group.isGroup ? <Badge>Lié</Badge> : null}
                  {playerAssignmentLabel ? (
                    <Badge>Joueur : {playerAssignmentLabel}</Badge>
                  ) : null}
                  <Badge>{token.isHiddenFromPlayers ? "Masqué joueurs" : "MJ"}</Badge>
                </div>
              </div>

              {token.notes ? <p className="stat-notes">{token.notes}</p> : null}

              <StatConditionList
                isGm={isGm}
                token={token}
                onAddCondition={(conditionId, value) =>
                  onAddCondition(token.id, conditionId, value)
                }
                onClearConditionDuration={(tokenConditionId) =>
                  onClearConditionDuration(token.id, tokenConditionId)
                }
                onDecrementConditionDuration={(tokenConditionId) =>
                  onDecrementConditionDuration(token.id, tokenConditionId)
                }
                onRemoveCondition={(tokenConditionId) =>
                  onRemoveCondition(token.id, tokenConditionId)
                }
                onUpdateCondition={(tokenConditionId, input) =>
                  onUpdateCondition(token.id, tokenConditionId, input)
                }
              />

              {isEditing ? (
                <StatTokenForm
                  token={token}
                  onCancel={() => setEditingTokenId(null)}
                  onSubmit={(input) => {
                    onUpdateToken(token.id, input);
                    setEditingTokenId(null);
                  }}
                />
              ) : null}

              {isGm ? (
                <div className="stat-card__actions">
                  <Button onClick={() => setEditingTokenId(token.id)}>
                    Modifier token
                  </Button>

                  <Button
                    onClick={() =>
                      setAddingTrackerTokenId(isAddingTracker ? null : token.id)
                    }
                  >
                    Ajouter tracker
                  </Button>

                  <Button onClick={() => onApplyPreset(token.id)}>
                    Appliquer preset
                  </Button>

                  <Button onClick={() => onRemoveToken(token.id)}>
                    Supprimer token
                  </Button>
                </div>
              ) : null}

              {isGm && isAddingTracker ? (
                <StatTrackerForm
                  onCancel={() => setAddingTrackerTokenId(null)}
                  onSubmit={(input) => {
                    onAddTracker(token.id, input);
                    setAddingTrackerTokenId(null);
                  }}
                />
              ) : null}

              {token.trackers.length === 0 ? (
                <p className="muted">
                  Aucun tracker. Appliquez le preset du type ou ajoutez un suivi
                  personnalisé.
                </p>
              ) : (
                <div className="stat-tracker-list">
                  {token.trackers.map((tracker) => (
                    <StatTrackerCard
                      key={tracker.id}
                      canEdit={canViewerEditTracker(token, tracker, viewer)}
                      isGm={isGm}
                      token={token}
                      tracker={tracker}
                      onChangeValue={(delta) =>
                        onChangeTrackerValue(token.id, tracker.id, delta)
                      }
                      onRemove={() => onRemoveTracker(token.id, tracker.id)}
                      onToggle={() => onToggleTracker(token.id, tracker.id)}
                      onUpdate={(input) =>
                        onUpdateTracker(token.id, tracker.id, input)
                      }
                    />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
