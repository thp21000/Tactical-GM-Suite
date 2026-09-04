import { setupStatBackground } from "./features/stats/background/setupStatBackground";
import { setupTokenToolsBackground } from "./features/token-tools/setupTokenToolsBackground";

// Dedicated Owlbear background entrypoint.
// Loaded by manifest.background_url as soon as the extension is enabled in a room,
// independently from opening the Tactical GM Suite action popover.
// All persistent scene/context-menu integrations must be registered here.
setupStatBackground();
setupTokenToolsBackground();
