import { useCallback, useEffect, useRef } from "react";

export function useAutosave(saveFn, { debounceMs = 2000, maxWaitMs = 10000 } = {}) {
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const pendingRef = useRef(false);

  const clearTimers = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(maxTimeoutRef.current);
    timeoutRef.current = null;
    maxTimeoutRef.current = null;
  }, []);

  const flush = useCallback(async () => {
    if (!pendingRef.current) return false;

    clearTimers();
    pendingRef.current = false;
    await saveFn();
    return true;
  }, [clearTimers, saveFn]);

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