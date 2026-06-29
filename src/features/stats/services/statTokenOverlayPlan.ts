import type {
  StatTokenSyncItem,
  StatTokenSyncPayload,
  StatTokenSyncStatus,
} from "./statTokenSync";

export type StatTokenOverlayAnchor = "top" | "bottom" | "left" | "right";

export type StatTokenOverlayLayout = {
  anchor: StatTokenOverlayAnchor;
  maxItems: number;
  gap: number;
  itemWidth: number;
  itemHeight: number;
};

export type StatTokenOverlayStyle = {
  variant: "compact" | "detailed";
  opacity: number;
  fontSize: number;
};

export type StatTokenOverlayPlanItem = {
  id: string;
  label: string;
  title: string;
  iconId: string;
  mode: StatTokenSyncItem["mode"];
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StatTokenOverlayPlan = {
  tokenId: string;
  sourceItemId: string;
  overlayId: string;
  tokenName: string;
  status: Extract<StatTokenSyncStatus, "ready" | "empty">;
  layout: StatTokenOverlayLayout;
  style: StatTokenOverlayStyle;
  items: StatTokenOverlayPlanItem[];
};

export type StatTokenOverlayPlanOptions = {
  layout?: Partial<StatTokenOverlayLayout>;
  style?: Partial<StatTokenOverlayStyle>;
};

export type StatTokenOverlayPlanReport = {
  plans: StatTokenOverlayPlan[];
  readyCount: number;
  emptyCount: number;
  itemCount: number;
  summary: string;
};

const DEFAULT_LAYOUT: StatTokenOverlayLayout = {
  anchor: "top",
  maxItems: 6,
  gap: 4,
  itemWidth: 72,
  itemHeight: 24,
};

const DEFAULT_STYLE: StatTokenOverlayStyle = {
  variant: "compact",
  opacity: 0.92,
  fontSize: 12,
};

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function normalizeLayout(
  layout: Partial<StatTokenOverlayLayout> | undefined,
): StatTokenOverlayLayout {
  return {
    anchor: layout?.anchor ?? DEFAULT_LAYOUT.anchor,
    maxItems: normalizePositiveInteger(layout?.maxItems, DEFAULT_LAYOUT.maxItems),
    gap: Math.max(0, Math.floor(layout?.gap ?? DEFAULT_LAYOUT.gap)),
    itemWidth: normalizePositiveInteger(layout?.itemWidth, DEFAULT_LAYOUT.itemWidth),
    itemHeight: normalizePositiveInteger(layout?.itemHeight, DEFAULT_LAYOUT.itemHeight),
  };
}

function normalizeStyle(
  style: Partial<StatTokenOverlayStyle> | undefined,
): StatTokenOverlayStyle {
  return {
    variant: style?.variant ?? DEFAULT_STYLE.variant,
    opacity: Math.min(1, Math.max(0, style?.opacity ?? DEFAULT_STYLE.opacity)),
    fontSize: normalizePositiveInteger(style?.fontSize, DEFAULT_STYLE.fontSize),
  };
}

function sanitizeOverlayIdPart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "unknown";
}

export function createOverlayId(sourceItemId: string): string {
  return `tactical-gm-stats-overlay-${sanitizeOverlayIdPart(sourceItemId)}`;
}

function createPlanItem(
  item: StatTokenSyncItem,
  index: number,
  layout: StatTokenOverlayLayout,
): StatTokenOverlayPlanItem {
  return {
    id: item.id,
    label: item.label,
    title: item.title,
    iconId: item.iconId,
    mode: item.mode,
    x: index * (layout.itemWidth + layout.gap),
    y: 0,
    width: layout.itemWidth,
    height: layout.itemHeight,
  };
}

export function createTokenOverlayPlan(
  payload: StatTokenSyncPayload,
  options: StatTokenOverlayPlanOptions = {},
): StatTokenOverlayPlan | null {
  if (payload.status === "not-linked" || !payload.sourceItemId) return null;

  const layout = normalizeLayout(options.layout);
  const style = normalizeStyle(options.style);
  const items = payload.items
    .slice(0, layout.maxItems)
    .map((item, index) => createPlanItem(item, index, layout));

  return {
    tokenId: payload.tokenId,
    sourceItemId: payload.sourceItemId,
    overlayId: createOverlayId(payload.sourceItemId),
    tokenName: payload.tokenName,
    status: payload.status === "ready" ? "ready" : "empty",
    layout,
    style,
    items,
  };
}

export function createOverlayPlansFromPayloads(
  payloads: StatTokenSyncPayload[],
  options: StatTokenOverlayPlanOptions = {},
): StatTokenOverlayPlan[] {
  return payloads
    .map((payload) => createTokenOverlayPlan(payload, options))
    .filter((plan): plan is StatTokenOverlayPlan => plan !== null);
}

export function getOverlayPlanSummary(plan: StatTokenOverlayPlan): string {
  if (plan.status === "empty") return "Overlay vide";

  return `Overlay plan · ${plan.items.length} item${plan.items.length > 1 ? "s" : ""} · ${plan.layout.anchor}`;
}

export function createOverlayPlanReport(
  payloads: StatTokenSyncPayload[],
  options: StatTokenOverlayPlanOptions = {},
): StatTokenOverlayPlanReport {
  const plans = createOverlayPlansFromPayloads(payloads, options);
  const readyCount = plans.filter((plan) => plan.status === "ready").length;
  const emptyCount = plans.filter((plan) => plan.status === "empty").length;
  const itemCount = plans.reduce((total, plan) => total + plan.items.length, 0);

  return {
    plans,
    readyCount,
    emptyCount,
    itemCount,
    summary: `${readyCount} plan${readyCount > 1 ? "s" : ""} prêt${readyCount > 1 ? "s" : ""} · ${itemCount} item${itemCount > 1 ? "s" : ""}`,
  };
}
