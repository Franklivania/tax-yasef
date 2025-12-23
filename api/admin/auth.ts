/**
 * Admin Auth Check Endpoint
 * Validates admin session cookie
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redisGet } from "../lib/redis.js";

function handleCORS(res: VercelResponse, origin?: string) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function getSessionToken(req: VercelRequest): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies["admin_session"] || null;
}

export async function validateAdminSession(
  req: VercelRequest
): Promise<boolean> {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) return false;

  try {
    const sessionKey = `admin:session:${sessionToken}`;
    const session = await redisGet<{ authenticated: boolean }>(sessionKey);
    return session?.authenticated === true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  handleCORS(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only GET requests are allowed",
    });
  }

  try {
    const isValid = await validateAdminSession(req);
    res.status(isValid ? 200 : 401).json({
      authenticated: isValid,
    });
    return;
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({
      authenticated: false,
      error: "Internal Server Error",
    });
    return;
  }
}
