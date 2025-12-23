import type { ModelID } from "./models";

export type AdminModelUsage = {
  model: ModelID;
  tokensUsedDay: number;
  tokensRemainingDay: number;
  requestsDay: number;
  blocked: boolean;
};

export type AdminUserUsage = {
  userId: string;
  ipAddress: string | null;
  lastActive: number;
  models: AdminModelUsage[];
};

export type AdminUsageStats = {
  model: ModelID;
  tokensUsedDay: number;
  tokensRemainingDay: number;
  requestsDay: number;
};

export type AdminUsageResponse = {
  users: AdminUserUsage[];
  stats: AdminUsageStats[];
};
