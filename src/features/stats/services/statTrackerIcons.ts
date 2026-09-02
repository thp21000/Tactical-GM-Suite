import type { StatTrackerIcon, StatTrackerIconCategory } from "../statTypes";

const iconModules = import.meta.glob("../assets/icons/**/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CATEGORY_BY_FOLDER: Record<string, StatTrackerIconCategory> = {
  "Corps & Protection": "body",
  "Arcane & Combat": "arcane",
  "Ressources & Richesses": "resource",
  "Objets & Marques": "object",
};

const ICON_LABELS: Record<string, string> = {
  body_heart: "Cœur",
  body_broken_heart: "Cœur brisé",
  body_drop: "Goutte",
  body_skull: "Crâne",
  body_bone: "Os",
  body_heal_cross: "Soin",
  body_shield: "Bouclier",
  body_cracked_shield: "Bouclier fissuré",
  body_helmet: "Casque",
  body_armor: "Armure",
  body_lock: "Cadenas",
  body_wall: "Rempart",
  arcane_rune: "Rune",
  arcane_crystal: "Cristal",
  arcane_star: "Étoile",
  arcane_eye: "Œil",
  arcane_portal: "Portail",
  arcane_flame: "Flamme",
  arcane_sword: "Épée",
  arcane_bow: "Arc",
  arcane_projectile: "Projectile",
  arcane_target: "Cible",
  arcane_explosion: "Explosion",
  arcane_lightning: "Éclair",
  arcane_axe: "Hache",
  arcane_book: "Livre",
  arcane_fireball: "Boule de feu",
  arcane_slime: "Gelée",
  resource_vial: "Fiole",
  resource_pouch: "Sacoche",
  resource_torch: "Torche",
  resource_ration: "Ration",
  resource_apple: "Pomme",
  resource_tool: "Outil",
  resource_coin: "Pièce",
  resource_platinum: "Platine",
  resource_gold: "Or",
  resource_silver: "Argent",
  resource_copper: "Cuivre",
  resource_gem: "Gemme",
  resource_gold_ingot: "Lingot d’or",
  resource_iron_ingot: "Lingot de fer",
  resource_copper_ingot: "Lingot de cuivre",
  resource_ruby: "Rubis",
  resource_toolbox: "Boîte à outils",
  resource_money_bag: "Bourse",
  resource_chest: "Coffre",
  resource_leaf: "Feuille",
  object_gear: "Engrenage",
  object_key: "Clé",
  object_bomb: "Bombe",
  object_hourglass: "Sablier",
  object_flag: "Drapeau",
  object_seal: "Sceau",
  object_circle: "Cercle",
  object_diamond: "Losange",
  object_square: "Carré",
  object_dot: "Point",
  object_arrow_up: "Flèche haut",
  object_arrow_down: "Flèche bas",
  object_raven: "Corbeau",
  object_mask: "Masque",
  object_stones: "Pierres",
};

/**
 * Couleur dominante volontairement déclarée pour chaque asset.
 * On évite l'extraction automatique depuis le PNG afin de conserver une UI
 * stable, lisible et cohérente même si une icône contient plusieurs couleurs.
 */
const ICON_ACCENTS: Record<string, string> = {
  body_heart: "#cf4055",
  body_broken_heart: "#d64658",
  body_drop: "#bd3349",
  body_skull: "#c9b994",
  body_bone: "#d6c8a7",
  body_heal_cross: "#55bd78",
  body_shield: "#5389b9",
  body_cracked_shield: "#687f9b",
  body_helmet: "#8998ab",
  body_armor: "#7d8da1",
  body_lock: "#ad8c58",
  body_wall: "#7d8793",

  arcane_rune: "#7b61d7",
  arcane_crystal: "#7165e3",
  arcane_star: "#d2a63f",
  arcane_eye: "#d79238",
  arcane_portal: "#8a54d4",
  arcane_flame: "#dc6734",
  arcane_sword: "#8e9eaf",
  arcane_bow: "#a16a42",
  arcane_projectile: "#8798aa",
  arcane_target: "#c34d4d",
  arcane_explosion: "#db6a32",
  arcane_lightning: "#3d8ed8",
  arcane_axe: "#8796a7",
  arcane_book: "#4f76c8",
  arcane_fireball: "#e25c2d",
  arcane_slime: "#34a8c8",

  resource_vial: "#ba4058",
  resource_pouch: "#9b6746",
  resource_torch: "#d97832",
  resource_ration: "#a67a49",
  resource_apple: "#cf493f",
  resource_tool: "#8493a1",
  resource_coin: "#d2a441",
  resource_platinum: "#aeb9ca",
  resource_gold: "#d5a63d",
  resource_silver: "#abb6c5",
  resource_copper: "#b9693e",
  resource_gem: "#4aaf8d",
  resource_gold_ingot: "#d5a13a",
  resource_iron_ingot: "#778491",
  resource_copper_ingot: "#b86b43",
  resource_ruby: "#c9324f",
  resource_toolbox: "#8c654c",
  resource_money_bag: "#b87336",
  resource_chest: "#3d9c62",
  resource_leaf: "#5a9d45",

  object_gear: "#9a744d",
  object_key: "#c18f39",
  object_bomb: "#a9503b",
  object_hourglass: "#c19748",
  object_flag: "#b94b55",
  object_seal: "#b9424d",
  object_circle: "#7f8797",
  object_diamond: "#7d71ba",
  object_square: "#7d8797",
  object_dot: "#9299a7",
  object_arrow_up: "#7f8797",
  object_arrow_down: "#7f8797",
  object_raven: "#6955a0",
  object_mask: "#ad8765",
  object_stones: "#667e94",
};

const CATEGORY_ACCENTS: Record<StatTrackerIconCategory, string> = {
  body: "#c95664",
  arcane: "#7764c8",
  resource: "#b98443",
  object: "#7e8797",
};

const ICON_ORDER = [
  "body_heart",
  "body_broken_heart",
  "body_drop",
  "body_skull",
  "body_bone",
  "body_heal_cross",
  "body_shield",
  "body_cracked_shield",
  "body_helmet",
  "body_armor",
  "body_lock",
  "body_wall",
  "arcane_rune",
  "arcane_crystal",
  "arcane_star",
  "arcane_eye",
  "arcane_portal",
  "arcane_flame",
  "arcane_sword",
  "arcane_bow",
  "arcane_projectile",
  "arcane_target",
  "arcane_explosion",
  "arcane_lightning",
  "resource_vial",
  "resource_pouch",
  "resource_torch",
  "resource_ration",
  "resource_apple",
  "resource_tool",
  "resource_coin",
  "resource_platinum",
  "resource_gold",
  "resource_silver",
  "resource_copper",
  "resource_gem",
  "object_gear",
  "object_key",
  "object_bomb",
  "object_hourglass",
  "object_flag",
  "object_seal",
  "object_circle",
  "object_diamond",
  "object_square",
  "object_dot",
  "object_arrow_up",
  "object_arrow_down",
];

const LEGACY_ICON_ALIASES: Record<string, string> = {
  heart: "body_heart",
  "temp-heart": "body_heart",
  shield: "body_shield",
  armor: "body_armor",
  ammo: "arcane_projectile",
  platinum: "resource_platinum",
  gold: "resource_gold",
  silver: "resource_silver",
  copper: "resource_copper",
  spell: "arcane_rune",
  "hero-point": "arcane_star",
  magic: "arcane_rune",
  counter: "object_circle",
  toggle: "object_circle",
  object: "object_square",
  trap: "object_bomb",
  familiar: "object_circle",
  other: "object_circle",
};

function getPathPart(path: string, offsetFromEnd: number): string {
  const parts = path.split("/");
  return parts[parts.length - offsetFromEnd] ?? "";
}

function getCategory(path: string): StatTrackerIconCategory | null {
  const folder = getPathPart(path, 2);
  return CATEGORY_BY_FOLDER[folder] ?? null;
}

function humanizeIconId(iconId: string): string {
  const withoutPrefix = iconId.replace(/^(body|arcane|resource|object)_/, "");
  const label = withoutPrefix.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getOrder(iconId: string): number {
  const index = ICON_ORDER.indexOf(iconId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export const STAT_TRACKER_ICONS: StatTrackerIcon[] = Object.entries(iconModules)
  .flatMap(([path, src]): StatTrackerIcon[] => {
    const category = getCategory(path);
    const fileName = getPathPart(path, 1);
    const id = fileName.replace(/\.png$/i, "");

    if (!category || !id) return [];

    return [
      {
        id,
        label: ICON_LABELS[id] ?? humanizeIconId(id),
        category,
        src,
        symbol: "◆",
      },
    ];
  })
  .sort((a, b) => {
    const orderDiff = getOrder(a.id) - getOrder(b.id);
    return orderDiff || a.label.localeCompare(b.label, "fr");
  });

export function getDefaultTrackerIconId(): string {
  return (
    STAT_TRACKER_ICONS.find((icon) => icon.id === "object_circle")?.id ??
    STAT_TRACKER_ICONS[0]?.id ??
    "other"
  );
}

export function normalizeTrackerIconId(iconId: string): string {
  if (STAT_TRACKER_ICONS.some((icon) => icon.id === iconId)) return iconId;

  const alias = LEGACY_ICON_ALIASES[iconId];
  if (alias && STAT_TRACKER_ICONS.some((icon) => icon.id === alias)) return alias;

  return getDefaultTrackerIconId();
}

export function getTrackerIcon(iconId: string): StatTrackerIcon {
  const normalized = normalizeTrackerIconId(iconId);

  return (
    STAT_TRACKER_ICONS.find((icon) => icon.id === normalized) ?? {
      id: "other",
      label: "Autre",
      category: "object",
      symbol: "◆",
    }
  );
}

export function getTrackerIconAccent(iconId: string): string {
  const normalized = normalizeTrackerIconId(iconId);
  const icon = getTrackerIcon(normalized);
  return ICON_ACCENTS[normalized] ?? CATEGORY_ACCENTS[icon.category];
}

export function getTrackerIconsByCategory(
  category: StatTrackerIconCategory,
): StatTrackerIcon[] {
  return STAT_TRACKER_ICONS.filter((icon) => icon.category === category);
}
