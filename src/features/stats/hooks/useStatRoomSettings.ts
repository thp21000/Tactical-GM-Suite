import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STAT_ROOM_SETTINGS,
  getStatRoomSettings,
  setStatRoomSettings,
  subscribeToStatRoomSettings,
  type StatRoomSettings,
} from "../services/statRoomSettings";

export function useStatRoomSettings(enabled: boolean) {
  const [settings, setSettings] = useState<StatRoomSettings>(DEFAULT_STAT_ROOM_SETTINGS);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSettings(DEFAULT_STAT_ROOM_SETTINGS);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let mounted = true;
    setLoading(true);

    void getStatRoomSettings()
      .then((next) => {
        if (!mounted) return;
        setSettings(next);
        setError(null);
      })
      .catch(() => {
        if (mounted) setError("Unable to read Stats room settings.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const unsubscribe = subscribeToStatRoomSettings((next) => {
      if (!mounted) return;
      setSettings(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [enabled]);

  const setAllowPlayerConditions = useCallback(async (enabledForPlayers: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const next = await setStatRoomSettings({
        allowPlayerConditions: enabledForPlayers,
      });
      setSettings(next);
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update Stats room settings.");
      throw cause;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    setAllowPlayerConditions,
  };
}
