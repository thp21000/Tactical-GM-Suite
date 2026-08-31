import { useCallback, useState } from "react";
import type { StatTrackedToken } from "../statTypes";
import {
  createOrUpdateTokenConditionOverlay,
  deleteTokenConditionOverlay,
} from "../services/statConditionOverlayObrSync";
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

function mergeResults(
  action: StatOverlayObrManualAction,
  trackerResult: StatOverlayObrSyncResult,
  conditionResult: StatOverlayObrSyncResult,
): StatOverlayObrSyncResult {
  const results = [trackerResult, conditionResult];
  const error = results.find((result) => result.status === "error");
  if (error) return error;

  const created = results.find((result) => result.status === "created");
  if (created) {
    return {
      ...created,
      action,
      message: `${trackerResult.message} · ${conditionResult.message}`,
    };
  }

  const updated = results.find((result) => result.status === "updated");
  if (updated) {
    return {
      ...updated,
      action,
      message: `${trackerResult.message} · ${conditionResult.message}`,
    };
  }

  const deleted = results.find((result) => result.status === "deleted");
  if (deleted) {
    return {
      ...deleted,
      action,
      message: `${trackerResult.message} · ${conditionResult.message}`,
    };
  }

  const unavailable = results.find((result) => result.status === "unavailable");
  if (unavailable) return unavailable;

  const notReady = results.find((result) => result.status === "not-ready");
  return notReady ?? trackerResult;
}

async function createOrUpdateAllTokenVisuals(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const trackerResult = await createOrUpdateTokenOverlay(token);
  const conditionResult = await createOrUpdateTokenConditionOverlay(token);
  return mergeResults("create-or-update", trackerResult, conditionResult);
}

async function deleteAllTokenVisuals(
  token: StatTrackedToken,
): Promise<StatOverlayObrSyncResult> {
  const trackerResult = await deleteTokenOverlay(token);
  const conditionResult = await deleteTokenConditionOverlay(token);
  return mergeResults("delete", trackerResult, conditionResult);
}

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
      runAction("create-or-update", token, createOrUpdateAllTokenVisuals),
    [runAction],
  );

  const deleteOverlay = useCallback(
    (token: StatTrackedToken) => runAction("delete", token, deleteAllTokenVisuals),
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
