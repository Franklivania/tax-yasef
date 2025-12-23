/**
 * Admin Login Endpoint
 * Validates admin key and sets session cookie
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redisSet } from "../lib/redis.js";
import crypto from "crypto";

const ADMIN_KEY = process.env.ADMIN_KEY;
const SESSION_DURATION = 24 * 60 * 60; // 24 hours

function handleCORS(res: VercelResponse, origin?: string) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  handleCORS(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST requests are allowed",
    });
  }

  if (!ADMIN_KEY) {
    return res.status(500).json({
      error: "Server Configuration Error",
      message: "Admin key not configured",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { key } = body as { key?: string };

    if (!key || key !== ADMIN_KEY) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid admin key",
      });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionKey = `admin:session:${sessionToken}`;

    // Store session in Redis (24 hour expiry)
    try {
      await redisSet(
        sessionKey,
        {
          authenticated: true,
          createdAt: Date.now(),
        },
        { ex: SESSION_DURATION }
      );
    } catch (redisError) {
      console.error("Redis error:", redisError);
      return res.status(500).json({
        error: "Database Error",
        message: "Failed to store session. Please check Redis connection.",
      });
    }

    // Set HTTP-only cookie (Secure only in production)
    const isProduction = process.env.VERCEL_ENV === "production";
    const cookieOptions = [
      `admin_session=${sessionToken}`,
      "HttpOnly",
      ...(isProduction ? ["Secure"] : []),
      "SameSite=Lax",
      `Max-Age=${SESSION_DURATION}`,
      "Path=/",
    ].join("; ");

    res.setHeader("Set-Cookie", cookieOptions);
    res.status(200).json({ success: true, authenticated: true });
    return;
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        error instanceof Error ? error.message : "Failed to authenticate",
    });
    return;
  }
}
