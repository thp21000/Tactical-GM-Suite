import type { StatTokenCondition } from "../statTypes";
import { getTrackerIcon } from "./statTrackerIcons";

/**
 * Les anciennes images de conditions étaient de grands anneaux prévus pour
 * entourer un token. Les conditions utilisent maintenant de petits badges :
 * on leur associe donc une icône compacte et sémantiquement lisible issue de
 * la bibliothèque Stats.
 */
const CONDITION_ICON_BY_ID: Record<string, string> = {
  accelere: "arcane_lightning",
  amical: "body_heart",
  aveugle: "arcane_eye",
  blesse: "body_broken_heart",
  controle: "arcane_rune",
  draine: "body_drop",
  effraye: "body_skull",
  empoigne: "body_lock",
  ensorcele: "arcane_star",
  fatigue: "object_hourglass",
  immobilise: "body_lock",
  inconscient: "body_broken_heart",
  invisible: "arcane_eye",
  malade: "resource_vial",
  "marque-du-chasseur": "arcane_target",
  mort: "body_skull",
  paralyse: "body_lock",
  petrifie: "object_stones",
  sourd: "body_helmet",
  etourdi: "arcane_star",

  // Compatibilité des anciennes sauvegardes.
  "a-terre": "object_arrow_down",
  agrippe: "body_lock",
  assourdi: "body_helmet",
  confus: "arcane_rune",
  ebloui: "arcane_star",
  empoisonne: "resource_vial",
  enchevetre: "body_lock",
  fascine: "arcane_eye",
  fuite: "object_arrow_up",
  ralenti: "object_hourglass",
  rapide: "arcane_lightning",
  saisi: "body_lock",
  stupefie: "arcane_star",
};

function normalizeConditionId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Owlbear scene images live outside the extension iframe. Vite asset imports
 * may be emitted as URLs relative to the extension deployment, so always turn
 * them into an absolute HTTPS URL before storing them in an Owlbear Image.
 */
function toAbsoluteAssetUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;

  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function getConditionTrackerIconId(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): string | undefined {
  return (
    CONDITION_ICON_BY_ID[normalizeConditionId(condition.conditionId)] ??
    CONDITION_ICON_BY_ID[normalizeConditionId(condition.label)] ??
    CONDITION_ICON_BY_ID[normalizeConditionId(condition.shortLabel)]
  );
}

export function getConditionAssetUrl(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): string | undefined {
  const iconId = getConditionTrackerIconId(condition);
  if (!iconId) return undefined;

  const src = getTrackerIcon(iconId).src;
  return src ? toAbsoluteAssetUrl(src) : undefined;
}

export function hasConditionAsset(
  condition: Pick<StatTokenCondition, "conditionId" | "label" | "shortLabel">,
): boolean {
  return Boolean(getConditionAssetUrl(condition));
}

export function getConditionAssetNames(): string[] {
  return Object.keys(CONDITION_ICON_BY_ID).sort((a, b) => a.localeCompare(b, "fr"));
}
