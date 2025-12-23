/**
 * User table component with infinite scroll and sorting
 * Models are column headers, showing usage per user per model
 */

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import StatusBadge from "../atoms/status-badge";
import type { AdminUserUsage } from "@/lib/types/admin";
import type { ModelID } from "@/lib/types/models";
import { ModelLimits, ModelOptions } from "@/lib/types/models";
import {
  sortUsers,
  type SortField,
  type SortDirection,
} from "@/lib/utils/admin/table-sort";
import { useInfiniteScroll } from "@/lib/utils/admin/infinite-scroll";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface UserTableProps {
  users: AdminUserUsage[];
  loading?: boolean;
  onUserClick: (user: AdminUserUsage) => void;
  onToggleBlock: (
    user: AdminUserUsage,
    model: ModelID,
    blocked: boolean
  ) => Promise<void>;
  blocking?: boolean;
}

interface SortButtonProps {
  field: SortField;
  sortConfig: {
    field: SortField;
    direction: SortDirection;
  };
  onSort: (field: SortField) => void;
}

const numberFmt = new Intl.NumberFormat("en-NG");
const PAGE_SIZE = 20;

// SortButton component defined outside to avoid creating during render
function SortButton({ field, sortConfig, onSort }: SortButtonProps) {
  const isActive = sortConfig.field === field;
  const Icon = isActive && sortConfig.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1"
      onClick={() => onSort(field)}
    >
      {isActive ? (
        <Icon className="size-3" />
      ) : (
        <ArrowUpDown className="size-3" />
      )}
    </Button>
  );
}

export default function UserTable({
  users,
  loading = false,
  onUserClick,
  blocking = false,
}: UserTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({ field: "lastActive", direction: "desc" });

  const sortedUsers = useMemo(
    () => sortUsers(users, sortConfig),
    [users, sortConfig]
  );

  const { displayedItems, hasMore, handleScroll } = useInfiniteScroll(
    sortedUsers,
    { pageSize: PAGE_SIZE }
  );

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Get model usage for a user
  const getModelUsage = (user: AdminUserUsage, model: ModelID) => {
    return user.models.find((m) => m.model === model);
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User token usage</CardTitle>
          {blocking ? (
            <span className="text-xs text-muted-foreground">Updating...</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader className="size-4" />
            Loading usage...
          </div>
        ) : displayedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No usage data.</p>
        ) : (
          <div
            className="max-h-[calc(100vh-400px)] overflow-x-auto overflow-y-auto"
            onScroll={handleScroll}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-background z-20">
                    <div className="flex items-center gap-1">
                      User ID
                      <SortButton
                        field="userId"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="flex items-center gap-1">
                      IP Address
                      <SortButton
                        field="ipAddress"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center gap-1">
                      Last Active
                      <SortButton
                        field="lastActive"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </div>
                  </TableHead>
                  {ModelOptions.map((option) => (
                    <TableHead
                      key={option.label}
                      className="text-center min-w-[180px]"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {numberFmt.format(
                            ModelLimits[option.label].tokensPerDay
                          )}{" "}
                          allocated
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right w-[120px]">
                    <div className="flex items-center justify-end gap-1">
                      Total Tokens
                      <SortButton
                        field="totalTokens"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-[120px]">
                    <div className="flex items-center justify-end gap-1">
                      Total Requests
                      <SortButton
                        field="totalRequests"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedItems.map((user) => {
                  const totalTokens = user.models.reduce(
                    (sum, m) => sum + m.tokensUsedDay,
                    0
                  );
                  const totalRequests = user.models.reduce(
                    (sum, m) => sum + m.requestsDay,
                    0
                  );

                  return (
                    <TableRow
                      key={user.userId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onUserClick(user)}
                    >
                      <TableCell className="font-mono text-xs sticky left-0 bg-background z-10">
                        {user.userId}
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.ipAddress || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </TableCell>
                      {ModelOptions.map((option) => {
                        const modelUsage = getModelUsage(user, option.label);
                        const limits = ModelLimits[option.label];
                        const allocated = limits.tokensPerDay;
                        const used = modelUsage?.tokensUsedDay || 0;
                        const blocked = modelUsage?.blocked || false;
                        const percentage =
                          allocated > 0 ? (used / allocated) * 100 : 0;
                        const isHighUsage = percentage > 80;

                        return (
                          <TableCell key={option.label} className="text-center">
                            {modelUsage ? (
                              <div className="flex flex-col gap-1 items-center">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold ${
                                      isHighUsage ? "text-destructive" : ""
                                    }`}
                                  >
                                    {numberFmt.format(used)} /{" "}
                                    {numberFmt.format(allocated)}
                                  </span>
                                  {blocked && (
                                    <StatusBadge
                                      blocked={true}
                                      className="text-xs"
                                    />
                                  )}
                                </div>
                                <div
                                  className={`text-xs ${isHighUsage ? "text-destructive" : "text-muted-foreground"}`}
                                >
                                  {percentage.toFixed(1)}% used
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No usage
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-semibold">
                        {numberFmt.format(totalTokens)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {numberFmt.format(totalRequests)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUserClick(user);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader className="size-4 mr-2" />
                Loading more...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
