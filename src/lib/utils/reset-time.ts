export function formatResetTime(resetAt: number): string {
  const now = Date.now();
  const resetTime = resetAt;
  const timeUntilReset = resetTime - now;

  if (timeUntilReset <= 0) {
    return "now";
  }

  const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function getResetTimeString(resetAt: number): string {
  const resetDate = new Date(resetAt);
  const now = new Date();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const resetTime = resetDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: userTimezone,
    hour12: true,
  });

  const resetDateStr = resetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: userTimezone,
  });

  const isToday =
    resetDate.toDateString() === now.toDateString() ||
    resetDate.getTime() - now.getTime() < 86400000;

  if (isToday) {
    return `today at ${resetTime}`;
  }

  return `${resetDateStr} at ${resetTime}`;
}
