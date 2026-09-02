import { setupStatBackground } from "./features/stats/background/setupStatBackground";

// Dedicated Owlbear background entrypoint.
// Loaded by manifest.background_url as soon as the extension is enabled in a room,
// independently from opening the Tactical GM Suite action popover.
setupStatBackground();
