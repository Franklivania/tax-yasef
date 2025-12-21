import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import {
  useNotificationStore,
  type Notification,
} from "@/lib/store/useNotificationStore";
import { useModelStore } from "@/lib/store/useModelStore";

export default function NotificationBanner() {
  const notifications = useNotificationStore((state) =>
    state.getNotifications()
  );
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification
  );
  const currentModel = useModelStore((state) => state.model);
  const previousModelRef = useRef<string>(currentModel);
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Check if notification is token-related and should persist
  const isTokenRelatedNotification = (message: string): boolean => {
    const tokenKeywords = [
      "select a different model",
      "different model to continue",
      "please select a different",
      "maximum daily usage",
      "maximum usage",
      "token limit exceeded",
      "try switching models",
      "exhaust",
    ];
    const lowerMessage = message.toLowerCase();
    return tokenKeywords.some((keyword) => lowerMessage.includes(keyword));
  };

  // Calculate timeout based on message length (reading speed ~200 words/min or ~3.3 chars/ms)
  const calculateTimeout = (message: string): number => {
    const minTimeout = 5000; // Minimum 5 seconds
    const readingSpeed = 3.3; // characters per millisecond (approximate)
    const baseTimeout = message.length / readingSpeed;
    return Math.max(minTimeout, baseTimeout);
  };

  // Handle model changes - dismiss token-related notifications
  useEffect(() => {
    if (previousModelRef.current !== currentModel) {
      notifications.forEach((notification) => {
        if (isTokenRelatedNotification(notification.message)) {
          removeNotification(notification.id);
          // Clear any pending timeout for this notification
          const timeout = timeoutRefs.current.get(notification.id);
          if (timeout) {
            clearTimeout(timeout);
            timeoutRefs.current.delete(notification.id);
          }
        }
      });
      previousModelRef.current = currentModel;
    }
  }, [currentModel, notifications, removeNotification]);

  // Auto-dismiss notifications
  useEffect(() => {
    const currentNotificationIds = new Set(notifications.map((n) => n.id));

    // Clean up timeouts for notifications that no longer exist
    timeoutRefs.current.forEach((timeout, id) => {
      if (!currentNotificationIds.has(id)) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(id);
      }
    });

    // Set up auto-dismiss for new notifications
    notifications.forEach((notification) => {
      // Skip if already has a timeout set
      if (timeoutRefs.current.has(notification.id)) {
        return;
      }

      // Don't auto-dismiss token-related notifications
      if (isTokenRelatedNotification(notification.message)) {
        return;
      }

      // Only auto-dismiss if dismissible
      if (!notification.dismissible) {
        return;
      }

      // Calculate timeout based on message length
      const timeout = calculateTimeout(notification.message);

      // Set timeout to remove notification
      const timeoutId = setTimeout(() => {
        removeNotification(notification.id);
        timeoutRefs.current.delete(notification.id);
      }, timeout);

      timeoutRefs.current.set(notification.id, timeoutId);
    });

    // Cleanup: clear all timeouts only on unmount
    // Copy ref value to avoid stale closure issues
    const timeouts = timeoutRefs.current;
    return () => {
      timeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  const getNotificationStyles = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return "bg-destructive/10 border-destructive/20 text-destructive";
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-500";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
      case "info":
      default:
        return "bg-muted border-border text-foreground";
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return "mynaui:danger-triangle-solid";
      case "success":
        return "ph:check-circle-fill";
      case "warning":
        return "material-symbols:warning-rounded";
      case "info":
      default:
        return "material-symbols:info-rounded";
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`w-full mx-auto p-3 rounded-md border flex items-start gap-2 ${getNotificationStyles(
            notification.type
          )}`}
        >
          <Icon
            icon={getNotificationIcon(notification.type)}
            className={`size-6 shrink-0 ${
              notification.type === "info" ? "-mt-1.5 md:m-0" : ""
            }`}
          />
          <p className="font-nunito flex-1">{notification.message}</p>
          {notification.dismissible && (
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 shrink-0 hover:opacity-70 transition-opacity"
              aria-label="Dismiss notification"
            >
              <Icon icon="material-symbols:close-rounded" className="size-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
