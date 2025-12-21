/**
 * Offline Indicator Component
 * Displays a message when the device is offline
 */

import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { SROnly } from "./sr-only";
import { Icon } from "@iconify/react";
import useDeviceSize from "@/lib/hooks/useDeviceSize";

export function OfflineIndicator() {
  const { isOffline } = useOnlineStatus();
  const { isMobile } = useDeviceSize();

  if (!isOffline) return null;

  return (
    <>
      <SROnly aria-live="assertive" aria-atomic={true}>
        You are currently offline. Some features may not be available.
      </SROnly>
      <div
        role="alert"
        aria-live="assertive"
        className={`fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 dark:bg-yellow-600/90 text-yellow-900 dark:text-yellow-100 border-b border-yellow-600 dark:border-yellow-700 ${
          isMobile ? "p-2" : "p-3"
        }`}
      >
        <div
          className={`flex items-center gap-2 ${
            isMobile ? "text-sm" : "text-base"
          }`}
        >
          <Icon
            icon="material-symbols:wifi-off"
            className={isMobile ? "size-4" : "size-5"}
            aria-hidden="true"
          />
          <span className="font-nunito font-medium">
            You are offline. Some features may not be available.
          </span>
        </div>
      </div>
    </>
  );
}
