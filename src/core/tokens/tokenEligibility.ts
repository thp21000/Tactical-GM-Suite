import type { Item } from "@owlbear-rodeo/sdk";

const SUPPORTED_LAYERS = new Set(["CHARACTER", "MOUNT", "PROP"]);

export function isSupportedTacticalTokenItem(
  item: Pick<Item, "type" | "layer">,
): boolean {
  return item.type === "IMAGE" && SUPPORTED_LAYERS.has(item.layer);
}

/**
 * Filtres communs des outils Tactical GM Suite applicables aux tokens.
 * Character, Mount et Prop sont acceptés ; les couches techniques sont exclues.
 */
export function getTacticalTokenContextKeyFilters() {
  return [
    { key: "type", value: "IMAGE" },
    { key: "layer", value: "MAP", operator: "!=" as const },
    { key: "layer", value: "GRID", operator: "!=" as const },
    { key: "layer", value: "DRAWING", operator: "!=" as const },
    { key: "layer", value: "ATTACHMENT", operator: "!=" as const },
    { key: "layer", value: "NOTE", operator: "!=" as const },
    { key: "layer", value: "TEXT", operator: "!=" as const },
    { key: "layer", value: "RULER", operator: "!=" as const },
    { key: "layer", value: "FOG", operator: "!=" as const },
    { key: "layer", value: "POINTER", operator: "!=" as const },
    { key: "layer", value: "POST_PROCESS", operator: "!=" as const },
    { key: "layer", value: "CONTROL", operator: "!=" as const },
    { key: "layer", value: "POPOVER", operator: "!=" as const },
  ];
}
