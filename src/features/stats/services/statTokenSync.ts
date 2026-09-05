import type { StatTrackedToken, StatTrackerVisibility, StatTrackerVisualType } from "../statTypes";
import {
  getTokenDisplayItems,
  getTokenDisplayItemsByVisibility,
  type StatTokenDisplayItem,
  type StatTokenDisplayItemMode,
  type StatTokenDisplayItemSource,
} from "./statTokenDisplay";

export type StatTokenSyncStatus = "ready" | "not-linked" | "empty";

export type StatTokenSyncItem = {
  id: string;
  source: StatTokenDisplayItemSource;
  sourceId: string;
  label: string;
  title: string;
  name: string;
  iconId: string;
  iconSrc?: string;
  accentColor: string;
  visualType: StatTrackerVisualType;
  mode: StatTokenDisplayItemMode;
  current?: number;
  max?: number;
  value?: number;
  enabled?: boolean;
  priority: number;
  visibility: StatTrackerVisibility;
};

export type StatTokenSyncPayload = {
  tokenId: string;
  sourceItemId?: string;
  tokenName: string;
  status: StatTokenSyncStatus;
  itemCount: number;
  items: StatTokenSyncItem[];
  updatedAt: string;
  visibility?: StatTrackerVisibility;
};

export type StatDryRunSyncReport = {
  payloads: StatTokenSyncPayload[];
  readyCount: number;
  notLinkedCount: number;
  emptyCount: number;
  itemCount: number;
  summary: string;
};

function toSyncItem(item: StatTokenDisplayItem): StatTokenSyncItem {
  return {
    id: item.id,
    source: item.source,
    sourceId: item.sourceId,
    label: item.label,
    title: item.title,
    name: item.name,
    iconId: item.iconId,
    iconSrc: item.iconSrc,
    accentColor: item.accentColor,
    visualType: item.visualType,
    mode: item.mode,
    current: item.current,
    max: item.max,
    value: item.value,
    enabled: item.enabled,
    priority: item.priority,
    visibility: item.visibility,
  };
}

export function getTokenSyncStatus(token: StatTrackedToken): StatTokenSyncStatus {
  if (!token.sourceItemId) return "not-linked";
  return getTokenDisplayItems(token).length > 0 ? "ready" : "empty";
}

export function createTokenSyncPayload(token: StatTrackedToken): StatTokenSyncPayload {
  const items = getTokenDisplayItems(token).map(toSyncItem);

  return {
    tokenId: token.id,
    sourceItemId: token.sourceItemId,
    tokenName: token.name,
    status: getTokenSyncStatus(token),
    itemCount: items.length,
    items,
    updatedAt: token.updatedAt,
  };
}

export function createTokenSyncPayloadForVisibility(
  token: StatTrackedToken,
  visibility: StatTrackerVisibility,
): StatTokenSyncPayload {
  const items = getTokenDisplayItemsByVisibility(token)[visibility].map(toSyncItem);
  const status: StatTokenSyncStatus = !token.sourceItemId
    ? "not-linked"
    : items.length > 0
      ? "ready"
      : "empty";

  return {
    tokenId: token.id,
    sourceItemId: token.sourceItemId,
    tokenName: token.name,
    status,
    itemCount: items.length,
    items,
    updatedAt: token.updatedAt,
    visibility,
  };
}

export function createStatSyncPayload(
  tokens: StatTrackedToken[],
): StatTokenSyncPayload[] {
  return tokens.map(createTokenSyncPayload);
}

export function getTokenSyncSummary(payload: StatTokenSyncPayload): string {
  if (payload.status === "not-linked") return "Non lié Owlbear";
  if (payload.status === "empty") return "Aucun item token";
  return `Sync prête · ${payload.itemCount} item${payload.itemCount > 1 ? "s" : ""}`;
}

export function createDryRunStatSyncReport(
  tokens: StatTrackedToken[],
): StatDryRunSyncReport {
  const payloads = createStatSyncPayload(tokens);
  const readyCount = payloads.filter((payload) => payload.status === "ready").length;
  const notLinkedCount = payloads.filter((payload) => payload.status === "not-linked").length;
  const emptyCount = payloads.filter((payload) => payload.status === "empty").length;
  const itemCount = payloads.reduce((total, payload) => total + payload.itemCount, 0);

  return {
    payloads,
    readyCount,
    notLinkedCount,
    emptyCount,
    itemCount,
    summary: `${readyCount} prêt${readyCount > 1 ? "s" : ""} · ${itemCount} item${itemCount > 1 ? "s" : ""}`,
  };
}
