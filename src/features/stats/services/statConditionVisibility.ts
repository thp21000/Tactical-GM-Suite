import type { StatTrackerVisibility } from "../statTypes";

const STAT_VISIBILITIES = new Set<StatTrackerVisibility>(["gm", "private", "public"]);

export function normalizeStatVisibility(value: unknown): StatTrackerVisibility {
  return typeof value === "string" && STAT_VISIBILITIES.has(value as StatTrackerVisibility)
    ? (value as StatTrackerVisibility)
    : "gm";
}
