import OBR from "@owlbear-rodeo/sdk";

export type ObrReadyState = { isAvailable: boolean; isReady: boolean; modeLabel: string };

export function isObrAvailable(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

export async function waitForObrReady(): Promise<boolean> {
  if (!isObrAvailable()) return false;
  try {
    await OBR.onReady(() => undefined);
    return true;
  } catch {
    return false;
  }
}
