/**
 * Table sorting utilities for admin dashboard
 */

import type { AdminUserUsage } from "@/lib/types/admin";
// import type { ModelID } from "@/lib/types/models";

export type SortField =
  | "userId"
  | "ipAddress"
  | "lastActive"
  | "totalTokens"
  | "totalRequests";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function sortUsers(
  users: AdminUserUsage[],
  config: SortConfig
): AdminUserUsage[] {
  const sorted = [...users];

  sorted.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (config.field) {
      case "userId":
        aValue = a.userId;
        bValue = b.userId;
        break;
      case "ipAddress":
        aValue = a.ipAddress || "";
        bValue = b.ipAddress || "";
        break;
      case "lastActive":
        aValue = a.lastActive;
        bValue = b.lastActive;
        break;
      case "totalTokens":
        aValue = a.models.reduce((sum, m) => sum + m.tokensUsedDay, 0);
        bValue = b.models.reduce((sum, m) => sum + m.tokensUsedDay, 0);
        break;
      case "totalRequests":
        aValue = a.models.reduce((sum, m) => sum + m.requestsDay, 0);
        bValue = b.models.reduce((sum, m) => sum + m.requestsDay, 0);
        break;
      default:
        return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return config.direction === "asc" ? comparison : -comparison;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return config.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  return sorted;
}
