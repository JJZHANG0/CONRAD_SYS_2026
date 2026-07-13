import { useCallback, useEffect, useRef, useState } from "react";

type SaveOptions = { allowInvalid?: boolean };

/**
 * Stable debounced auto-save: always calls the latest save fn
 * (avoids stale closures when save/data identity changes every keystroke).
 */
export function useDebouncedAutoSave(
  save: (redirectAfter: boolean, options?: SaveOptions) => Promise<boolean>,
  delay = 1500
) {
  const saveRef = useRef(save);
  saveRef.current = save;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveRef.current(false, { allowInvalid: true });
    }, delay);
  }, [delay]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return scheduleAutoSave;
}

/** Form state that stays in sync with a ref for immediate reads inside debounced saves. */
export function useSyncedFormState<T>(initial: T) {
  const dataRef = useRef(initial);
  const [data, setDataState] = useState(initial);

  const setData = useCallback((updater: T | ((prev: T) => T)) => {
    setDataState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      dataRef.current = next;
      return next;
    });
  }, []);

  const syncFromServer = useCallback((next: T) => {
    dataRef.current = next;
    setDataState(next);
  }, []);

  return { data, setData, dataRef, syncFromServer };
}
