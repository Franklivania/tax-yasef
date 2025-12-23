/**
 * Admin Logout Endpoint
 * Invalidates session and clears cookie
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redisDel } from "../lib/redis.js";

function handleCORS(res: VercelResponse, origin?: string) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  handleCORS(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST requests are allowed",
    });
    return;
  }

  try {
    const sessionToken = getSessionToken(req);

    // Invalidate session in Redis if token exists
    if (sessionToken) {
      const sessionKey = `admin:session:${sessionToken}`;
      try {
        await redisDel(sessionKey);
      } catch (redisError) {
        console.error("Redis error during logout:", redisError);
        // Continue even if Redis deletion fails
      }
    }

    // Clear cookie by setting it to expire immediately
    const isProduction = process.env.VERCEL_ENV === "production";
    const cookieOptions = [
      "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC",
      "HttpOnly",
      ...(isProduction ? ["Secure"] : []),
      "SameSite=Lax",
      "Max-Age=0",
      "Path=/",
    ].join("; ");

    res.setHeader("Set-Cookie", cookieOptions);
    res.status(200).json({ success: true, loggedOut: true });
    return;
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to logout",
    });
    return;
  }
}
