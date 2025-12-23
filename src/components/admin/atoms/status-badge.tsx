/**
 * Status badge atom for user/model status
 */

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  blocked: boolean;
  className?: string;
}

export default function StatusBadge({ blocked, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-xs font-medium",
        blocked
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-secondary-foreground",
        className
      )}
    >
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}
