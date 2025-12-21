/**
 * Online Status Hook
 * Detects online/offline status and provides reactive state
 */

import { useEffect, useState } from "react";

export interface UseOnlineStatusReturn {
  /**
   * Whether the device is currently online
   */
  isOnline: boolean;
  /**
   * Whether the device is currently offline
   */
  isOffline: boolean;
  /**
   * Timestamp of the last online status change
   */
  lastStatusChange: number | null;
}

/**
 * Hook to detect online/offline status
 * @returns Online status state and utilities
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });
  const [lastStatusChange, setLastStatusChange] = useState<number | null>(
    () => {
      if (typeof window === "undefined") return null;
      return Date.now();
    }
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastStatusChange(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastStatusChange(Date.now());
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    lastStatusChange,
  };
}
