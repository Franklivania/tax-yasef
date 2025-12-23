/**
 * Tracking Sync Endpoint
 * Receives localStorage token usage data from clients and stores in KV
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redisGet, redisSet, redisKeys } from "../lib/redis.js";
import type { UserUsageData, ModelID } from "../types.js";

const ACTIVE_USER_THRESHOLD = 5 * 60 * 1000; // 5 minutes

interface SyncRequest {
  userToken: string;
  ipAddress?: string | null;
  modelUsage: Record<
    ModelID,
    {
      minute: { tokens: number; requests: number; resetAt: number };
      day: { tokens: number; requests: number; resetAt: number };
    }
  >;
}

function handleCORS(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  handleCORS(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST requests are allowed",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { userToken, ipAddress, modelUsage }: SyncRequest = body;

    if (!userToken || !modelUsage) {
      return res.status(400).json({
        error: "Bad Request",
        message: "userToken and modelUsage are required",
      });
    }

    const now = Date.now();

    // Import ModelLimits (dynamic import to avoid module resolution issues in Vercel dev)
    const { ModelLimits } = await import("../types.js");

    // Transform client usage data to server format
    const userData: UserUsageData = {
      userToken,
      ipAddress: ipAddress || null,
      lastActive: now,
      modelUsage: {} as UserUsageData["modelUsage"],
    };

    // Process each model's usage
    for (const [modelId, usage] of Object.entries(modelUsage)) {
      const model = modelId as ModelID;
      const dayUsage = usage.day;

      // Get model limits
      const limits = ModelLimits[model];
      if (!limits) continue;

      userData.modelUsage[model] = {
        tokensUsedDay: dayUsage.tokens,
        tokensRemainingDay: Math.max(0, limits.tokensPerDay - dayUsage.tokens),
        requestsDay: dayUsage.requests,
      };

      // Update model-level stats
      const statsKey = `model:stats:${model}`;
      const existingStats = await redisGet<{
        totalTokensUsed: number;
        totalRequests: number;
        activeUsers: string[];
        lastUpdated: number;
      }>(statsKey);

      const activeUsers = new Set(existingStats?.activeUsers || []);
      activeUsers.add(userToken);

      // Remove inactive users (last active > threshold)
      const allUserKeys = await redisKeys(`user:*`);
      for (const key of allUserKeys) {
        if (typeof key === "string" && key.startsWith("user:")) {
          const userData = await redisGet<UserUsageData>(key);
          if (userData && now - userData.lastActive > ACTIVE_USER_THRESHOLD) {
            activeUsers.delete(userData.userToken);
          }
        }
      }

      await redisSet(
        statsKey,
        {
          totalTokensUsed:
            (existingStats?.totalTokensUsed || 0) + dayUsage.tokens,
          totalRequests:
            (existingStats?.totalRequests || 0) + dayUsage.requests,
          activeUsers: Array.from(activeUsers),
          lastUpdated: now,
        },
        { ex: 86400 * 2 }
      ); // Expire after 2 days
    }

    // Store user data
    const userKey = `user:${userToken}`;
    await redisSet(userKey, userData, { ex: 86400 * 7 }); // Expire after 7 days

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Tracking sync error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to sync usage data",
    });
  }
}
