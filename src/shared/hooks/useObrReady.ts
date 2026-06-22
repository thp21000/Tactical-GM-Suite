import { useEffect, useState } from "react";
import {
  getObrReadyState,
  subscribeToObrReady,
  type ObrReadyState,
} from "../../core/obr/obrReady";

export function useObrReady(): ObrReadyState {
  const [state, setState] = useState<ObrReadyState>(() => getObrReadyState());

  useEffect(() => {
    setState(getObrReadyState());

    return subscribeToObrReady(() => {
      setState(getObrReadyState());
    });
  }, []);

  return state;
}
