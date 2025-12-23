/**
 * Redis Client
 * Shared Redis connection for all API endpoints
 */

import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;

export async function getRedisClient() {
  // Return existing connected client
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // If already connecting, wait a bit and retry
  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  isConnecting = true;

  try {
    redisClient = createClient({
      url,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    isConnecting = false;
    return redisClient;
  } catch (error) {
    isConnecting = false;
    redisClient = null;
    throw error;
  }
}

// Helper functions for common operations
export async function redisSet(
  key: string,
  value: unknown,
  options?: { ex?: number }
): Promise<void> {
  const client = await getRedisClient();
  const serialized = JSON.stringify(value);
  if (options?.ex) {
    await client.setEx(key, options.ex, serialized);
  } else {
    await client.set(key, serialized);
  }
}

export async function redisGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const value = await client.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function redisDel(key: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(key);
}

export async function redisKeys(pattern: string): Promise<string[]> {
  const client = await getRedisClient();
  const keys = await client.keys(pattern);
  return keys;
}
