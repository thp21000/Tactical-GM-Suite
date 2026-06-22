import { MODULE_IDS } from "../constants/ids";
import type { GmSuiteModule } from "./moduleTypes";

const modules = [
  { id: MODULE_IDS.CORE, name: "Core / Dashboard", shortName: "Core", status: "core", enabledByDefault: true, canDisable: false, order: 1, description: "Base commune de la suite, navigation, paramètres et registre de modules." },
  { id: MODULE_IDS.INITIATIVE, name: "Initiative Tracker", shortName: "Initiative", status: "next", enabledByDefault: true, canDisable: true, order: 2, description: "Suivi avancé des tours, rounds, états et groupes de combat." },
  { id: MODULE_IDS.RANGE, name: "Distance / Déplacement / Portée", shortName: "Distances", status: "planned", enabledByDefault: true, canDisable: true, order: 3, description: "Affichage tactique des déplacements, portées d’attaque et zones d’effet." },
  { id: MODULE_IDS.STATS, name: "Stat Tracker", shortName: "Stats", status: "planned", enabledByDefault: true, canDisable: true, order: 4, description: "Suivi graphique des PV, CA, états, ressources et dangers." },
  { id: MODULE_IDS.CALENDAR, name: "Calendar", shortName: "Calendar", status: "future", enabledByDefault: false, canDisable: true, order: 5, description: "Calendrier, temps, événements, météo et suivi d’aventure." },
  { id: MODULE_IDS.LOOT_TABLE, name: "Loot Table", shortName: "Loot", status: "future", enabledByDefault: false, canDisable: true, order: 6, description: "Tables de butin, tirages, imports, exports et partage." },
] satisfies GmSuiteModule[];

export const moduleRegistry: GmSuiteModule[] = [...modules].sort((a, b) => a.order - b.order);

export const getModuleById = (id: string) => moduleRegistry.find((module) => module.id === id);
