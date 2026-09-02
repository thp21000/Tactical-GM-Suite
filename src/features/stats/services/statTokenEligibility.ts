import type { Item } from "@owlbear-rodeo/sdk";

const SUPPORTED_LAYERS = new Set(["CHARACTER", "MOUNT", "PROP"]);

export function isSupportedStatTokenItem(
  item: Pick<Item, "type" | "layer">,
): boolean {
  return item.type === "IMAGE" && SUPPORTED_LAYERS.has(item.layer);
}

/**
 * Filtres négatifs utilisés par le Context Menu Owlbear.
 * Ils permettent les trois couches de token (Character, Mount, Prop) tout en
 * acceptant une sélection mixte de ces couches.
 */
export function getStatTokenContextKeyFilters() {
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
