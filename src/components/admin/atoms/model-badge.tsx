/**
 * Model badge atom for displaying model information
 */

import type { ModelID } from "@/lib/types/models";
import { cn } from "@/lib/utils";

interface ModelBadgeProps {
  model: ModelID;
  used: number;
  allocated: number;
  className?: string;
}

export default function ModelBadge({
  model,
  used,
  allocated,
  className,
}: ModelBadgeProps) {
  const percentage = allocated > 0 ? (used / allocated) * 100 : 0;
  const isHighUsage = percentage > 80;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border border-border p-2 text-xs",
        className
      )}
    >
      <div className="font-medium">{model}</div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>
          {used.toLocaleString()} / {allocated.toLocaleString()}
        </span>
        <span
          className={cn(
            "font-semibold",
            isHighUsage ? "text-destructive" : "text-foreground"
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
