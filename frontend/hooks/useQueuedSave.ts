import { useCallback, useRef } from "react";

interface QueueItem<T> {
  request: T;
  resolve: (saved: boolean) => void;
}

/**
 * Runs saves sequentially and keeps every request's explicit snapshot.
 *
 * This prevents blur/day-switch races from sending multiple PATCH requests at
 * once or saving a previous day's content into the newly selected day.
 */
export function useQueuedSave<T>(
  worker: (request: T) => Promise<boolean>
): (request: T) => Promise<boolean> {
  const workerRef = useRef(worker);
  workerRef.current = worker;
  const queueRef = useRef<QueueItem<T>[]>([]);
  const processingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (queueRef.current.length) {
        const item = queueRef.current.shift();
        if (!item) continue;
        let saved = false;
        try {
          saved = await workerRef.current(item.request);
        } catch {
          saved = false;
        }
        item.resolve(saved);
      }
    } finally {
      processingRef.current = false;
    }
  }, []);

  return useCallback(
    (request: T) =>
      new Promise<boolean>((resolve) => {
        queueRef.current.push({ request, resolve });
        void processQueue();
      }),
    [processQueue]
  );
}
