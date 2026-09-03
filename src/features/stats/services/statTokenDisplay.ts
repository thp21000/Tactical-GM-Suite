import type {
  StatTrackedToken,
  StatTracker,
  StatTrackerVisibility,
} from "../statTypes";
import { getTrackerIcon } from "./statTrackerIcons";
import { getTrackerDisplayValue } from "./statTrackers";

export type StatTokenDisplayItemSource = "tracker";

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

/**
 * Stats token display is tracker-only by design.
 * Conditions have their own metadata key, scene items and synchronization service.
 */
export function getTokenDisplayItems(token: StatTrackedToken): StatTokenDisplayItem[] {
  return token.trackers
    .map(getTrackerTokenDisplayItem)
    .filter((item): item is StatTokenDisplayItem => item !== null)
    .sort(
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
  if (items.length === 0) return "Aucun tracker affiché sur token";
  return `${items.length} tracker${items.length > 1 ? "s" : ""}`;
}
