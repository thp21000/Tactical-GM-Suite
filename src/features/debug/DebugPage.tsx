import { EXTENSION_ID, ROOM_METADATA_KEYS, STORAGE_KEYS } from "../../core/constants/ids";
import { moduleRegistry } from "../../core/modules/moduleRegistry";
import type { ModuleStateMap } from "../../core/modules/moduleState";
import type { ObrReadyState } from "../../core/obr/obrReady";
import { Panel } from "../../shared/components/Panel";
export function DebugPage({ obr, moduleStates }: { obr: ObrReadyState; moduleStates: ModuleStateMap }) { return <Panel title="Debug"><pre>{JSON.stringify({ EXTENSION_ID, OBR_disponible: obr.isAvailable ? "oui" : "non", OBR_pret: obr.isReady ? "oui" : "non", STORAGE_KEYS, ROOM_METADATA_KEYS, modules: moduleRegistry, moduleStates }, null, 2)}</pre></Panel>; }
