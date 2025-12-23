/**
 * User details dialog component
 * Enhanced with proper color grading and theme-fitting scrollbar
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "../atoms/status-badge";
import type { AdminUserUsage } from "@/lib/types/admin";
import type { ModelID } from "@/lib/types/models";
import { ModelLimits } from "@/lib/types/models";
import { cn } from "@/lib/utils";

interface UserDialogProps {
  user: AdminUserUsage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleBlock: (
    user: AdminUserUsage,
    model: ModelID,
    blocked: boolean
  ) => Promise<void>;
  blocking?: boolean;
}

const numberFmt = new Intl.NumberFormat("en-NG");

export default function UserDialog({
  user,
  open,
  onOpenChange,
  onToggleBlock,
  blocking = false,
}: UserDialogProps) {
  if (!user) return null;

  const lastActiveDate = new Date(user.lastActive);
  const totalTokens = user.models.reduce((sum, m) => sum + m.tokensUsedDay, 0);
  const totalRequests = user.models.reduce((sum, m) => sum + m.requestsDay, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl! max-h-[80vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl">User Details</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Detailed information and management for user {user.userId}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-4 space-y-4">
          {/* User Info */}
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    User ID
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {user.userId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    IP Address
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {user.ipAddress || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Last Active
                  </span>
                  <span className="text-sm text-foreground">
                    {lastActiveDate.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Tokens Used
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {numberFmt.format(totalTokens)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Requests
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {numberFmt.format(totalRequests)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Usage */}
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Model Usage & Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {user.models.map((model) => {
                  const limits = ModelLimits[model.model];
                  const allocated = limits.tokensPerDay;
                  const used = model.tokensUsedDay;
                  const remaining = model.tokensRemainingDay;
                  const percentage =
                    allocated > 0 ? (used / allocated) * 100 : 0;
                  const isHighUsage = percentage > 80;
                  const isMediumUsage = percentage > 50;

                  return (
                    <Card
                      key={model.model}
                      className={cn(
                        "border transition-all duration-200",
                        model.blocked
                          ? "border-destructive/50 bg-destructive/5"
                          : isHighUsage
                            ? "border-destructive/30 bg-destructive/5"
                            : isMediumUsage
                              ? "border-primary/30 bg-primary/5"
                              : "border-border bg-card/30"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">
                            {model.model}
                          </CardTitle>
                          <StatusBadge blocked={model.blocked} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Used</span>
                            <span
                              className={cn(
                                "font-semibold",
                                isHighUsage
                                  ? "text-destructive"
                                  : "text-foreground"
                              )}
                            >
                              {numberFmt.format(used)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Allocated
                            </span>
                            <span className="font-semibold text-foreground">
                              {numberFmt.format(allocated)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Remaining
                            </span>
                            <span
                              className={cn(
                                "font-semibold",
                                remaining < allocated * 0.2
                                  ? "text-destructive"
                                  : "text-foreground"
                              )}
                            >
                              {numberFmt.format(remaining)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Requests
                            </span>
                            <span className="font-semibold text-foreground">
                              {numberFmt.format(model.requestsDay)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                Usage
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-semibold",
                                  isHighUsage
                                    ? "text-destructive"
                                    : isMediumUsage
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                )}
                              >
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-300 rounded-full",
                                  isHighUsage
                                    ? "bg-destructive"
                                    : isMediumUsage
                                      ? "bg-primary"
                                      : "bg-primary/50"
                                )}
                                style={{
                                  width: `${Math.min(percentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={model.blocked ? "secondary" : "destructive"}
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            onToggleBlock(user, model.model, !model.blocked)
                          }
                          disabled={blocking}
                        >
                          {model.blocked ? "Unblock Model" : "Block Model"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
