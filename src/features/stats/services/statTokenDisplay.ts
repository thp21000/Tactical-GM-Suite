import type {
  StatTrackedToken,
  StatTracker,
  StatTrackerVisibility,
  StatTrackerVisualType,
} from "../statTypes";
import {
  getTrackerIcon,
  getTrackerIconAccent,
} from "./statTrackerIcons";
import { getTrackerDisplayValue } from "./statTrackers";

export type StatTokenDisplayItemSource = "tracker";

/**
 * Familles visuelles utilisées par l'overlay token. Les types techniques
 * counter/readonly partagent volontairement le même renderer "value".
 */
export type StatTokenDisplayItemMode = "icon" | "bar" | "value" | "toggle";

export type StatTokenDisplayItem = {
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

const DEFAULT_DISPLAY_PRIORITY = 50;

function getTrackerDisplayMode(tracker: StatTracker): StatTokenDisplayItemMode {
  if (tracker.visualType === "bar") return "bar";
  if (tracker.visualType === "icon") return "icon";
  if (tracker.visualType === "toggle") return "toggle";
  return "value";
}

export function getTrackerTokenDisplayLabel(tracker: StatTracker): string {
  if (tracker.visualType === "icon") return tracker.name;
  if (tracker.visualType === "toggle") return tracker.name;
  return `${tracker.name} ${getTrackerDisplayValue(tracker)}`;
}

export function getTrackerTokenDisplayTitle(tracker: StatTracker): string {
  const icon = getTrackerIcon(tracker.iconId);
  const value = tracker.visualType === "icon" ? undefined : getTrackerDisplayValue(tracker);

  return [
    tracker.name,
    icon.label,
    value ? `Valeur: ${value}` : undefined,
    tracker.showOnToken ? "Affiché sur le token" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function getTrackerTokenDisplayItem(
  tracker: StatTracker,
): StatTokenDisplayItem | null {
  if (!tracker.showOnToken) return null;

  const icon = getTrackerIcon(tracker.iconId);
  return {
    id: `tracker-${tracker.id}`,
    source: "tracker",
    sourceId: tracker.id,
    label: getTrackerTokenDisplayLabel(tracker),
    title: getTrackerTokenDisplayTitle(tracker),
    name: tracker.name,
    iconId: tracker.iconId,
    iconSrc: icon.src,
    accentColor: getTrackerIconAccent(tracker.iconId),
    visualType: tracker.visualType,
    mode: getTrackerDisplayMode(tracker),
    current: tracker.current,
    max: tracker.max,
    value: tracker.value,
    enabled: tracker.enabled,
    priority: DEFAULT_DISPLAY_PRIORITY,
    visibility: tracker.visibility,
  };
}

/**
 * Stats token display is tracker-only by design.
 * Conditions have their own metadata key, scene items and synchronization service.
 */
export function getTokenDisplayItems(token: StatTrackedToken): StatTokenDisplayItem[] {
  // L'ordre manuel des trackers du profil est conservé. Il devient l'ordre de
  // lecture du Stat Dock ; on n'infère jamais une priorité depuis le nom/icône.
  return token.trackers
    .map(getTrackerTokenDisplayItem)
    .filter((item): item is StatTokenDisplayItem => item !== null);
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
