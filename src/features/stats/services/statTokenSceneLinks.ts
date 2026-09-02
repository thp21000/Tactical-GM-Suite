import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { EXTENSION_ID } from "../../../core/constants/ids";
import { isObrReady } from "../../../core/obr/obrReady";
import type { StatTrackedToken } from "../statTypes";

export const STAT_TOKEN_LINK_METADATA_KEY = `${EXTENSION_ID}/stats-token-link`;
export const STAT_TOKEN_LINK_KIND = "stats-token-link";

export type StatTokenLinkMetadata = {
  kind: typeof STAT_TOKEN_LINK_KIND;
  tokenId: string;
  /** Whether the canonical Stats profile is currently active in the tracker. */
  tracked?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readStatTokenLinkMetadata(
  item: Pick<Item, "metadata">,
): StatTokenLinkMetadata | undefined {
  const value = item.metadata?.[STAT_TOKEN_LINK_METADATA_KEY];
  if (!isRecord(value)) return undefined;
  if (value.kind !== STAT_TOKEN_LINK_KIND || typeof value.tokenId !== "string") {
    return undefined;
  }

  return {
    kind: STAT_TOKEN_LINK_KIND,
    tokenId: value.tokenId,
    tracked: typeof value.tracked === "boolean" ? value.tracked : undefined,
  };
}

export function getLinkedStatTokenId(
  item: Pick<Item, "metadata">,
): string | undefined {
  return readStatTokenLinkMetadata(item)?.tokenId;
}

export function isStatTokenTrackedItem(
  item: Pick<Item, "metadata">,
): boolean {
  return readStatTokenLinkMetadata(item)?.tracked === true;
}

export function getSceneStatTokenInstances(
  tokens: StatTrackedToken[],
  items: Item[],
): StatTrackedToken[] {
  const tokenById = new Map(tokens.map((token) => [token.id, token]));
  const currentItemIds = new Set(items.map((item) => item.id));
  const itemIdsByTokenId = new Map<string, string[]>();

  for (const item of items) {
    const tokenId = getLinkedStatTokenId(item);
    if (!tokenId || !tokenById.has(tokenId)) continue;

    const existing = itemIdsByTokenId.get(tokenId) ?? [];
    existing.push(item.id);
    itemIdsByTokenId.set(tokenId, existing);
  }

  const instances: StatTrackedToken[] = [];

  for (const token of tokens) {
    if (token.isTracked === false) continue;

    const linkedItemIds = [...(itemIdsByTokenId.get(token.id) ?? [])];

    // Backward compatibility: tokens tracked before scene-link metadata existed
    // are still recognized in their original scene. The hook will annotate
    // that source item so future Owlbear copies inherit the canonical Stats ID.
    if (
      token.sourceItemId &&
      currentItemIds.has(token.sourceItemId) &&
      !linkedItemIds.includes(token.sourceItemId)
    ) {
      linkedItemIds.unshift(token.sourceItemId);
    }

    if (linkedItemIds.length === 0) {
      // Manual Stats entries have no Owlbear scene instance and remain global.
      if (!token.sourceItemId) instances.push(token);
      continue;
    }

    for (const sourceItemId of linkedItemIds) {
      instances.push({ ...token, sourceItemId });
    }
  }

  return instances;
}

export async function ensureCurrentSceneStatTokenLinks(
  tokens: StatTrackedToken[],
  items: Item[],
): Promise<void> {
  if (!isObrReady() || items.length === 0) return;

  const tokenById = new Map(tokens.map((token) => [token.id, token]));
  const tokenBySourceItemId = new Map(
    tokens.flatMap((token) =>
      token.sourceItemId ? ([[token.sourceItemId, token]] as const) : [],
    ),
  );

  const tokenForItem = (item: Item): StatTrackedToken | undefined => {
    const linkedTokenId = getLinkedStatTokenId(item);
    if (linkedTokenId) {
      const linkedToken = tokenById.get(linkedTokenId);
      if (linkedToken) return linkedToken;
    }

    return tokenBySourceItemId.get(item.id);
  };

  const targets = items.filter((item) => {
    const token = tokenForItem(item);
    if (!token) return false;

    const existing = readStatTokenLinkMetadata(item);
    const tracked = token.isTracked !== false;
    return existing?.tokenId !== token.id || existing.tracked !== tracked;
  });

  if (targets.length === 0) return;

  await OBR.scene.items.updateItems(targets, (drafts) => {
    for (const draft of drafts) {
      const token = tokenForItem(draft);
      if (!token) continue;

      draft.metadata[STAT_TOKEN_LINK_METADATA_KEY] = {
        kind: STAT_TOKEN_LINK_KIND,
        tokenId: token.id,
        tracked: token.isTracked !== false,
      } satisfies StatTokenLinkMetadata;
    }
  });
}
