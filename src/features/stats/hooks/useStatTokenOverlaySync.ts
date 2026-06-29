import { useCallback, useState } from "react";
import type { StatTrackedToken } from "../statTypes";
import {
  createOrUpdateTokenOverlay,
  deleteTokenOverlay,
  type StatOverlayObrManualAction,
  type StatOverlayObrSyncResult,
} from "../services/statTokenOverlayObrSync";

type UseStatTokenOverlaySyncState = {
  loadingAction?: StatOverlayObrManualAction;
  lastResult?: StatOverlayObrSyncResult;
};

export function useStatTokenOverlaySync() {
  const [state, setState] = useState<UseStatTokenOverlaySyncState>({});

  const runAction = useCallback(
    async (
      action: StatOverlayObrManualAction,
      token: StatTrackedToken,
      handler: (token: StatTrackedToken) => Promise<StatOverlayObrSyncResult>,
    ) => {
      if (state.loadingAction) return state.lastResult;

      setState((current) => ({ ...current, loadingAction: action }));
      const result = await handler(token);
      setState({ lastResult: result });
      return result;
    },
    [state.lastResult, state.loadingAction],
  );

  const createOrUpdateOverlay = useCallback(
    (token: StatTrackedToken) =>
      runAction("create-or-update", token, createOrUpdateTokenOverlay),
    [runAction],
  );

  const deleteOverlay = useCallback(
    (token: StatTrackedToken) => runAction("delete", token, deleteTokenOverlay),
    [runAction],
  );

  return {
    createOrUpdateOverlay,
    deleteOverlay,
    isLoading: Boolean(state.loadingAction),
    loadingAction: state.loadingAction,
    lastResult: state.lastResult,
  };
}
