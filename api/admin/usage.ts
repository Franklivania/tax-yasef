/**
 * Admin Usage Endpoint
 * Returns real usage data from KV storage
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redisGet, redisSet, redisDel, redisKeys } from "../lib/redis.js";
import { validateAdminSession } from "./auth.js";
import type {
  AdminUsageResponse,
  AdminUserUsage,
  AdminModelUsage,
  ModelID,
  UserUsageData,
} from "../types.js";
import { ModelLimits, ModelOptions } from "../types.js";

const ACTIVE_USER_THRESHOLD = 5 * 60 * 1000; // 5 minutes

function handleCORS(res: VercelResponse, origin?: string) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function unauthorized(res: VercelResponse) {
  res.status(401).json({
    error: "Unauthorized",
    message: "Invalid or missing admin session",
  });
}

function methodNotAllowed(res: VercelResponse) {
  res.status(405).json({
    error: "Method Not Allowed",
    message: "Only GET and POST are allowed",
  });
}

async function getAllUsersFromKV(): Promise<AdminUserUsage[]> {
  const userKeys = await redisKeys("user:*");
  const users: AdminUserUsage[] = [];

  for (const key of userKeys) {
    if (typeof key === "string") {
      const userData = await redisGet<UserUsageData>(key);
      if (userData) {
        const now = Date.now();
        const isActive = now - userData.lastActive < ACTIVE_USER_THRESHOLD;

        // Only include active users or users with recent activity
        if (isActive || userData.lastActive > now - 86400000) {
          const models: AdminModelUsage[] = ModelOptions.map((opt) => {
            const usage = userData.modelUsage[opt.label] || {
              tokensUsedDay: 0,
              tokensRemainingDay: 0,
              requestsDay: 0,
            };

            return {
              model: opt.label,
              tokensUsedDay: usage.tokensUsedDay,
              tokensRemainingDay: usage.tokensRemainingDay,
              requestsDay: usage.requestsDay,
              blocked: false, // Will be set below
            };
          });

          // Check blocks for all models
          const modelsWithBlocks = await Promise.all(
            models.map(async (model) => {
              const blockKey = `blocked:${userData.userToken}:${model.model}`;
              const blockValue = await redisGet<boolean>(blockKey);
              const isBlocked = blockValue === true;
              return { ...model, blocked: isBlocked };
            })
          );

          users.push({
            userId: userData.userToken,
            ipAddress: userData.ipAddress,
            lastActive: userData.lastActive,
            models: modelsWithBlocks,
          });
        }
      }
    }
  }

  return users;
}

async function computeStatsFromKV(): Promise<AdminUsageResponse["stats"]> {
  const stats: AdminUsageResponse["stats"] = [];

  for (const opt of ModelOptions) {
    const statsKey = `model:stats:${opt.label}`;
    const modelStats = await redisGet<{
      totalTokensUsed: number;
      totalRequests: number;
      activeUsers: string[];
      lastUpdated: number;
    }>(statsKey);

    if (modelStats) {
      const limits = ModelLimits[opt.label];
      stats.push({
        model: opt.label,
        tokensUsedDay: modelStats.totalTokensUsed,
        tokensRemainingDay: Math.max(
          0,
          limits.tokensPerDay - modelStats.totalTokensUsed
        ),
        requestsDay: modelStats.totalRequests,
      });
    } else {
      const limits = ModelLimits[opt.label];
      stats.push({
        model: opt.label,
        tokensUsedDay: 0,
        tokensRemainingDay: limits.tokensPerDay,
        requestsDay: 0,
      });
    }
  }

  return stats;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  handleCORS(res, req.headers.origin);

  // Validate admin session
  const isValid = await validateAdminSession(req);
  if (!isValid) {
    unauthorized(res);
    return;
  }

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    try {
      const users = await getAllUsersFromKV();
      const stats = await computeStatsFromKV();

      const response: AdminUsageResponse = {
        users,
        stats,
      };

      res.status(200).json(response);
      return;
    } catch (error) {
      console.error("Error fetching usage data:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch usage data",
      });
      return;
    }
  }

  if (req.method === "POST") {
    try {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const {
        userId,
        model,
        blocked: shouldBlock,
      } = body as {
        userId?: string;
        model?: ModelID;
        blocked?: boolean;
      };

      if (!userId || !model || typeof shouldBlock !== "boolean") {
        res.status(400).json({
          error: "Bad Request",
          message: "userId, model, and blocked are required",
        });
        return;
      }

      const blockKey = `blocked:${userId}:${model}`;

      if (shouldBlock) {
        await redisSet(blockKey, true, { ex: 86400 * 30 }); // Expire after 30 days
      } else {
        await redisDel(blockKey);
      }

      res.status(200).json({ success: true });
      return;
    } catch (error) {
      console.error("Error updating block status:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update block status",
      });
      return;
    }
  }

  methodNotAllowed(res);
}
