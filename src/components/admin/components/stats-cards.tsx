/**
 * Model statistics cards component
 * Shows system-wide totals with total allocation pool
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminUsageStats } from "@/lib/types/admin";
import { ModelLimits, ModelTotalPool } from "@/lib/types/models";

interface StatsCardsProps {
  stats: AdminUsageStats[];
  users: AdminUserUsage[];
}

const numberFmt = new Intl.NumberFormat("en-NG");

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <Accordion type="single" collapsible defaultValue="stats">
      <AccordionItem value="stats">
        <AccordionTrigger>
          Model statistics (daily) - System-wide totals
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-muted-foreground mb-4">
            Aggregated usage across all users for each model. Shows total tokens
            used from the pool, remaining pool capacity, and requests for the
            entire platform.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat) => {
              const limits = ModelLimits[stat.model];
              const perUserAllocation = limits.tokensPerDay;
              const totalPool = ModelTotalPool[stat.model];
              const totalRemaining = Math.max(
                0,
                totalPool - stat.tokensUsedDay
              );
              const usagePercentage =
                totalPool > 0 ? (stat.tokensUsedDay / totalPool) * 100 : 0;

              return (
                <Card
                  key={stat.model}
                  className="border border-border bg-card/50 backdrop-blur-sm"
                >
                  <CardHeader>
                    <CardTitle className="text-base">{stat.model}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Total Used (all users)
                      </span>
                      <span className="font-semibold text-foreground">
                        {numberFmt.format(stat.tokensUsedDay)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">Total Pool</span>
                      <span className="font-semibold text-primary">
                        {numberFmt.format(totalPool)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Remaining Pool
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          totalRemaining < totalPool * 0.2
                            ? "text-destructive"
                            : "text-foreground"
                        )}
                      >
                        {numberFmt.format(totalRemaining)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">
                        Per-user Allocation
                      </span>
                      <span className="font-semibold text-foreground">
                        {numberFmt.format(perUserAllocation)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Total Requests
                      </span>
                      <span className="font-semibold text-foreground">
                        {numberFmt.format(stat.requestsDay)}
                      </span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-muted-foreground">
                          Pool Usage
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            usagePercentage > 80
                              ? "text-destructive"
                              : "text-primary"
                          )}
                        >
                          {usagePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300 rounded-full",
                            usagePercentage > 80
                              ? "bg-destructive"
                              : "bg-primary"
                          )}
                          style={{
                            width: `${Math.min(usagePercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Import needed for cn utility
import { cn } from "@/lib/utils";
import type { AdminUserUsage } from "@/lib/types/admin";
