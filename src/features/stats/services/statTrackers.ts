import type { StatTracker, StatTrackerInput } from "../statTypes";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function clamp(value: number, max?: number): number {
  if (max === undefined) return value;
  return Math.max(0, Math.min(value, Math.max(max, 0)));
}

export function createTracker(input: StatTrackerInput): StatTracker {
  const timestamp = now();
  const visualType = input.visualType;
  const max = input.max !== undefined ? Math.max(0, input.max) : undefined;
  const current = visualType === "bar" ? clamp(input.current ?? max ?? 0, max) : input.current;
  const value = visualType === "counter" || visualType === "readonly" ? input.value ?? input.current ?? 0 : input.value;

  return {
    id: createId("tracker"),
    name: input.name.trim() || "Tracker",
    visualType,
    iconId: input.iconId || "other",
    current,
    max,
    value,
    enabled: visualType === "toggle" ? input.enabled ?? false : input.enabled,
    visibility: input.visibility ?? "gm",
    canPlayerEdit: input.canPlayerEdit ?? false,
    showOnToken: input.showOnToken ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateTracker(tracker: StatTracker, patch: Partial<StatTrackerInput>): StatTracker {
  const visualType = patch.visualType ?? tracker.visualType;
  const max = patch.max !== undefined ? Math.max(0, patch.max) : tracker.max;
  const next: StatTracker = {
    ...tracker,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() || "Tracker" : tracker.name,
    visualType,
    max,
    updatedAt: now(),
  };

  if (visualType === "bar") {
    next.current = clamp(patch.current ?? tracker.current ?? max ?? 0, max);
  }
  if (visualType === "counter") {
    next.value = patch.value ?? tracker.value ?? tracker.current ?? 0;
  }
  if (visualType === "readonly") {
    next.value = patch.value ?? tracker.value ?? 0;
  }
  if (visualType === "toggle") {
    next.enabled = patch.enabled ?? tracker.enabled ?? false;
  }

  return next;
}

export function canQuickModifyTracker(tracker: StatTracker): boolean {
  return tracker.visualType === "bar" || tracker.visualType === "counter";
}

export function changeTrackerValue(tracker: StatTracker, delta: number): StatTracker {
  if (tracker.visualType === "bar") {
    return { ...tracker, current: clamp((tracker.current ?? 0) + delta, tracker.max), updatedAt: now() };
  }
  if (tracker.visualType === "counter") {
    return { ...tracker, value: (tracker.value ?? tracker.current ?? 0) + delta, updatedAt: now() };
  }
  return tracker;
}

export function setTrackerValue(tracker: StatTracker, value: number): StatTracker {
  if (tracker.visualType === "bar") {
    return { ...tracker, current: clamp(value, tracker.max), updatedAt: now() };
  }
  if (tracker.visualType === "counter" || tracker.visualType === "readonly") {
    return { ...tracker, value, updatedAt: now() };
  }
  return tracker;
}

export function toggleTracker(tracker: StatTracker): StatTracker {
  if (tracker.visualType !== "toggle") return tracker;
  return { ...tracker, enabled: !tracker.enabled, updatedAt: now() };
}

export function getTrackerDisplayValue(tracker: StatTracker): string {
  if (tracker.visualType === "bar") return `${tracker.current ?? 0}${tracker.max !== undefined ? ` / ${tracker.max}` : ""}`;
  if (tracker.visualType === "counter" || tracker.visualType === "readonly") return String(tracker.value ?? tracker.current ?? 0);
  if (tracker.visualType === "toggle") return tracker.enabled ? "Actif" : "Inactif";
  return "—";
}
