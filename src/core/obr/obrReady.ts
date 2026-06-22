import OBR from "@owlbear-rodeo/sdk";

export type ObrReadyState = {
  isAvailable: boolean;
  isReady: boolean;
  modeLabel: string;
};

export function isObrAvailable(): boolean {
  return OBR.isAvailable;
}

export function isObrReady(): boolean {
  return OBR.isReady;
}

export function getObrReadyState(): ObrReadyState {
  const isAvailable = isObrAvailable();
  const isReady = isObrReady();

  return {
    isAvailable,
    isReady,
    modeLabel: !isAvailable
      ? "Mode développement local"
      : isReady
        ? "Owlbear prêt"
        : "Owlbear détecté",
  };
}

export function subscribeToObrReady(onReady: () => void): () => void {
  if (!isObrAvailable() || isObrReady()) {
    return () => undefined;
  }

  const unsubscribe = (OBR.onReady as (callback: () => void) => void | (() => void))(onReady);

  return typeof unsubscribe === "function" ? unsubscribe : () => undefined;
}
