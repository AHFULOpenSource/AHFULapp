import { useCallback, useEffect, useRef } from "react";

export function useAutosave(saveFn, { debounceMs = 2000, maxWaitMs = 10000 } = {}) {
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const pendingRef = useRef(false);
  const inFlightRef = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(maxTimeoutRef.current);
    timeoutRef.current = null;
    maxTimeoutRef.current = null;
  }, []);

  const flush = useCallback(async () => {
    if (inFlightRef.current) {
      clearTimers();
      return inFlightRef.current;
    }
    if (!pendingRef.current) return false;

    clearTimers();
    pendingRef.current = false;
    inFlightRef.current = Promise.resolve()
      .then(saveFn)
      .catch(() => ({ ok: false }))
      .then((result) => {
        inFlightRef.current = null;
        if (result?.ok === false) {
          pendingRef.current = true;
          clearTimers();
          // Keep retries bounded while triggers reset the debounce timer.
          maxTimeoutRef.current = setTimeout(() => {
            void flush();
          }, debounceMs);
          return false;
        }
        if (pendingRef.current) {
          clearTimers();
          timeoutRef.current = setTimeout(() => {
            void flush();
          }, debounceMs);
        }
        return true;
      });
    return inFlightRef.current;
  }, [clearTimers, debounceMs, saveFn]);

  const trigger = useCallback(() => {
    pendingRef.current = true;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void flush();
    }, debounceMs);

    if (!maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        void flush();
      }, maxWaitMs);
    }
  }, [debounceMs, flush, maxWaitMs]);

  useEffect(() => {
    return () => {
      void flush();
    };
  }, [flush]);

  return { trigger, flush, isPending: () => pendingRef.current };
}
