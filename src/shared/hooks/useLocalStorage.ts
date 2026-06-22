import { useCallback, useState } from "react";
import { readJson, writeJson } from "../../core/storage/localStorage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readJson(key, initialValue));
  const setStoredValue = useCallback((nextValue: T) => { setValue(nextValue); writeJson(key, nextValue); }, [key]);
  return [value, setStoredValue] as const;
}
