import { useEffect, useState } from "react";
import { isObrAvailable, waitForObrReady, type ObrReadyState } from "../../core/obr/obrReady";

export function useObrReady(): ObrReadyState {
  const [state, setState] = useState<ObrReadyState>(() => ({ isAvailable: isObrAvailable(), isReady: false, modeLabel: isObrAvailable() ? "Owlbear détecté" : "Mode développement local" }));
  useEffect(() => { let mounted = true; waitForObrReady().then((isReady) => { if (mounted) setState({ isAvailable: isObrAvailable(), isReady, modeLabel: isReady ? "Owlbear prêt" : "Mode développement local" }); }); return () => { mounted = false; }; }, []);
  return state;
}
