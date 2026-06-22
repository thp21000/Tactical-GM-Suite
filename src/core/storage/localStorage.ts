const getStorage = (): Storage | null => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
};

export function readJson<T>(key: string, fallback: T): T {
  try {
    const storage = getStorage();
    if (!storage) return fallback;
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
