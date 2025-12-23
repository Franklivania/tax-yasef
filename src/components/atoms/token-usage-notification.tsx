import { useEffect, useState, useRef } from "react";
import { useTokenUsageStore } from "@/lib/store/useTokenUsageStore";
import { useModelStore } from "@/lib/store/useModelStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { ModelLimits } from "@/lib/types/models";
import { formatResetTime, getResetTimeString } from "@/lib/utils/time";

export default function TokenUsageNotification() {
  const currentModel = useModelStore((state) => state.model);
  const tokenStore = useTokenUsageStore();
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const lastNotificationRef = useRef<{
    type: string;
    model: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    tokenStore.resetIfNeeded();
    const interval = setInterval(() => {
      tokenStore.resetIfNeeded();
      setUpdateTrigger((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenStore]);

  useEffect(() => {
    const usage = tokenStore.modelUsage[currentModel];
    const limits = ModelLimits[currentModel];

    // Safety check: ensure usage exists
    if (!usage || !limits) {
      return;
    }

    const remaining = tokenStore.getRemaining(currentModel);

    const dayUsagePercent = (usage.day.tokens / limits.tokensPerDay) * 100;

    const isDayLimitReached =
      usage.day.tokens >= limits.tokensPerDay ||
      usage.day.requests >= limits.requestsPerDay;
    const isMinuteLimitReached =
      usage.minute.tokens >= limits.tokensPerMin ||
      usage.minute.requests >= limits.requestsPerMin;

    const now = Date.now();
    const lastNotif = lastNotificationRef.current;
    const shouldNotify =
      !lastNotif ||
      lastNotif.model !== currentModel ||
      lastNotif.type !== "token-usage" ||
      now - lastNotif.timestamp > 60000;

    if (isDayLimitReached && shouldNotify) {
      const resetTime = getResetTimeString(usage.day.resetAt);
      addNotification(
        "error",
        `You have reached maximum daily usage for ${currentModel}. Time resets ${resetTime}. Please select a different model to continue.`,
        true
      );
      lastNotificationRef.current = {
        type: "token-usage",
        model: currentModel,
        timestamp: now,
      };
    } else if (isMinuteLimitReached && shouldNotify) {
      const resetTime = formatResetTime(usage.minute.resetAt);
      addNotification(
        "warning",
        `You have reached maximum usage per minute for ${currentModel}. Resets in ${resetTime}.`,
        true
      );
      lastNotificationRef.current = {
        type: "token-usage",
        model: currentModel,
        timestamp: now,
      };
    } else if (dayUsagePercent >= 80 && shouldNotify) {
      const resetTime = getResetTimeString(usage.day.resetAt);
      addNotification(
        "info",
        `You have used ${Math.round(dayUsagePercent)}% of your daily limit for ${currentModel}. Time resets ${resetTime}.`,
        true
      );
      lastNotificationRef.current = {
        type: "token-usage",
        model: currentModel,
        timestamp: now,
      };
    } else if (remaining < 1000 && remaining > 0 && shouldNotify) {
      addNotification(
        "info",
        `You have ${remaining.toLocaleString()} tokens remaining for ${currentModel}.`,
        true
      );
      lastNotificationRef.current = {
        type: "token-usage",
        model: currentModel,
        timestamp: now,
      };
    }
  }, [currentModel, updateTrigger, tokenStore, addNotification]);

  return null;
}
