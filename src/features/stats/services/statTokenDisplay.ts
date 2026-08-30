import type {
  StatConditionTokenDisplayMode,
  StatTrackedToken,
  StatTracker,
  StatTrackerVisibility,
} from "../statTypes";
import {
  getTokenConditionDisplayItems,
  type StatConditionTokenDisplayItem,
} from "./statConditions";
import { getTrackerIcon } from "./statTrackerIcons";
import { getTrackerDisplayValue } from "./statTrackers";

export type StatTokenDisplayItemSource = "tracker" | "condition";

export type StatTokenDisplayItemMode = "badge" | "icon" | "bar" | "value";

export type StatTokenDisplayItem = {
  id: string;
  source: StatTokenDisplayItemSource;
  sourceId: string;
  label: string;
  title: string;
  iconId: string;
  mode: StatTokenDisplayItemMode;
  priority: number;
  visibility: StatTrackerVisibility;
};

const DEFAULT_DISPLAY_PRIORITY = 50;

function normalizePriority(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_DISPLAY_PRIORITY;
  }

  return Math.min(100, Math.max(0, Math.floor(value)));
}

function getTrackerDisplayMode(tracker: StatTracker): StatTokenDisplayItemMode {
  if (tracker.visualType === "bar") return "bar";
  if (tracker.visualType === "icon") return "icon";
  return "value";
}

export function getTrackerTokenDisplayLabel(tracker: StatTracker): string {
  if (tracker.visualType === "icon") return tracker.name;

  return `${tracker.name} ${getTrackerDisplayValue(tracker)}`;
}

export function getTrackerTokenDisplayTitle(tracker: StatTracker): string {
  const icon = getTrackerIcon(tracker.iconId);
  const value = tracker.visualType === "icon" ? undefined : getTrackerDisplayValue(tracker);

  return [
    tracker.name,
    icon.label,
    value ? `Valeur: ${value}` : undefined,
    tracker.showOnToken ? "Aperçu token préparé" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function getTrackerTokenDisplayItem(
  tracker: StatTracker,
): StatTokenDisplayItem | null {
  if (!tracker.showOnToken) return null;

  return {
    id: `tracker-${tracker.id}`,
    source: "tracker",
    sourceId: tracker.id,
    label: getTrackerTokenDisplayLabel(tracker),
    title: getTrackerTokenDisplayTitle(tracker),
    iconId: tracker.iconId,
    mode: getTrackerDisplayMode(tracker),
    priority: DEFAULT_DISPLAY_PRIORITY,
    visibility: tracker.visibility,
  };
}

function mapConditionMode(mode: StatConditionTokenDisplayMode): StatTokenDisplayItemMode {
  if (mode === "icon") return "icon";
  return "badge";
}

function getConditionTokenDisplayItem(
  condition: StatConditionTokenDisplayItem,
): StatTokenDisplayItem {
  return {
    id: `condition-${condition.id}`,
    source: "condition",
    sourceId: condition.conditionId,
    label: condition.label,
    title: condition.title,
    iconId: condition.iconId,
    mode: mapConditionMode(condition.mode),
    priority: normalizePriority(condition.priority),
    visibility: condition.visibility,
  };
}

export function getTokenDisplayItems(token: StatTrackedToken): StatTokenDisplayItem[] {
  const trackerItems = token.trackers
    .map(getTrackerTokenDisplayItem)
    .filter((item): item is StatTokenDisplayItem => item !== null);
  const conditionItems = getTokenConditionDisplayItems(token).map(
    getConditionTokenDisplayItem,
  );

  return [...trackerItems, ...conditionItems].sort(
    (a, b) => a.priority - b.priority || a.label.localeCompare(b.label, "fr"),
  );
}

export type StatTokenDisplayItemsByVisibility = Record<
  StatTrackerVisibility,
  StatTokenDisplayItem[]
>;

export function getTokenDisplayItemsByVisibility(
  token: StatTrackedToken,
): StatTokenDisplayItemsByVisibility {
  const items = getTokenDisplayItems(token);

  // Security boundary: private and GM items are never promoted into public output.
  return {
    public: items.filter((item) => item.visibility === "public"),
    private: items.filter((item) => item.visibility === "private"),
    gm: items.filter((item) => item.visibility === "gm"),
  };
}

export function getPublicTokenDisplayItems(
  token: StatTrackedToken,
): StatTokenDisplayItem[] {
  return getTokenDisplayItemsByVisibility(token).public;
}

export function getPrivateTokenDisplayItems(
  token: StatTrackedToken,
): StatTokenDisplayItem[] {
  return getTokenDisplayItemsByVisibility(token).private;
}

export function getGmTokenDisplayItems(
  token: StatTrackedToken,
): StatTokenDisplayItem[] {
  return getTokenDisplayItemsByVisibility(token).gm;
}

export function getTokenDisplayPreviewSummary(token: StatTrackedToken): string {
  const items = getTokenDisplayItems(token);
  if (items.length === 0) return "Aucun aperçu token";

  const trackerCount = items.filter((item) => item.source === "tracker").length;
  const conditionCount = items.filter((item) => item.source === "condition").length;

  return [
    trackerCount ? `${trackerCount} tracker${trackerCount > 1 ? "s" : ""}` : undefined,
    conditionCount
      ? `${conditionCount} condition${conditionCount > 1 ? "s" : ""}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}
