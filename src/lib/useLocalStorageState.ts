"use client";

import { useCallback, useMemo, useState, useSyncExternalStore, type SetStateAction } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function serverSnapshot() {
  return null;
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  parse: (value: string) => T = JSON.parse,
): [T, (update: SetStateAction<T>) => void] {
  const [fallbackValue] = useState(initialValue);
  const snapshot = useSyncExternalStore(subscribe, () => readStorage(key), serverSnapshot);
  const value = useMemo(() => {
    try {
      return snapshot === null ? fallbackValue : parse(snapshot);
    } catch {
      return fallbackValue;
    }
  }, [snapshot, fallbackValue, parse]);

  const setValue = useCallback((update: SetStateAction<T>) => {
    let currentValue = fallbackValue;
    try {
      const stored = readStorage(key);
      if (stored !== null) currentValue = parse(stored);
    } catch {
      currentValue = fallbackValue;
    }
    const nextValue = typeof update === "function"
      ? (update as (previous: T) => T)(currentValue)
      : update;
    window.localStorage.setItem(key, JSON.stringify(nextValue));
    window.dispatchEvent(new Event("storage"));
  }, [key, fallbackValue, parse]);

  return [value, setValue];
}