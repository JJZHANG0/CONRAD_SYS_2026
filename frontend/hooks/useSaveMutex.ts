import { useCallback, useRef } from "react";

/**
 * Ensures only one save runs at a time. If another save is requested while one is
 * in flight, it is queued and runs once with the latest arguments.
 */
export function useSaveMutex<T extends (...args: never[]) => Promise<boolean>>(save: T): T {
  const saveRef = useRef(save);
  saveRef.current = save;
  const busyRef = useRef(false);
  const queuedRef = useRef<Parameters<T> | null>(null);

  const wrapped = useCallback(async (...args: Parameters<T>) => {
    if (busyRef.current) {
      queuedRef.current = args;
      return false;
    }

    busyRef.current = true;
    try {
      return await saveRef.current(...args);
    } finally {
      busyRef.current = false;
      const queued = queuedRef.current;
      queuedRef.current = null;
      if (queued) {
        await wrapped(...queued);
      }
    }
  }, []) as T;

  return wrapped;
}
