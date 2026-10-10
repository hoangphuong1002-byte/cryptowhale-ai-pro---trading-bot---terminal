// Hook to recover app state when user returns to tab/app after being away
// Directly solves: "app thoát lâu thì vô khó có cách nào cải thiện" & "tat mo tren dt lau"
import { useEffect, useState, useRef } from 'react';

interface UseAppVisibilityRecoveryOptions {
  onForegroundWake: () => void;
  staleThresholdMs?: number;
}

export function useAppVisibilityRecovery({
  onForegroundWake,
  staleThresholdMs = 15000,
}: UseAppVisibilityRecoveryOptions) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasBackgrounded, setWasBackgrounded] = useState<boolean>(false);
  const lastActiveTimestamp = useRef<number>(Date.now());
  const lastWakeExecution = useRef<number>(0);
  const wakeCallbackRef = useRef(onForegroundWake);

  // Keep callback reference updated without triggering re-subscription
  useEffect(() => {
    wakeCallbackRef.current = onForegroundWake;
  }, [onForegroundWake]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const triggerWakeIfNeeded = () => {
      const now = Date.now();
      const timeAway = now - lastActiveTimestamp.current;
      const timeSinceLastWake = now - lastWakeExecution.current;

      // Debounce: Never trigger twice within 8 seconds (solves mobile focus + visibilitychange collision)
      if (timeAway >= staleThresholdMs && timeSinceLastWake > 8000) {
        lastWakeExecution.current = now;
        setWasBackgrounded(true);
        wakeCallbackRef.current();
        setTimeout(() => setWasBackgrounded(false), 2000);
      }
      lastActiveTimestamp.current = now;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerWakeIfNeeded();
      } else {
        lastActiveTimestamp.current = Date.now();
      }
    };

    // Mobile bfcache support (iOS Safari & Android Chrome resume)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        triggerWakeIfNeeded();
      }
    };

    const handleFocus = () => {
      triggerWakeIfNeeded();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('focus', handleFocus, { passive: true });
    window.addEventListener('pageshow', handlePageShow, { passive: true });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [staleThresholdMs]);

  return { isOnline, wasBackgrounded };
}
