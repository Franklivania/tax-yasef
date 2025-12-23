/**
 * Vercel Serverless Function - Groq API Proxy
 * Securely handles Groq API calls server-side
 */

// Vercel serverless function types
// Install @vercel/node for full type support: npm install -D @vercel/node
type VercelRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};
import { Groq } from "groq-sdk";

// Type definitions for request/response
interface GroqRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface GroqResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

// Validate request body
function validateRequest(body: unknown): body is GroqRequest {
  if (!body || typeof body !== "object") return false;
  const req = body as Record<string, unknown>;
  return typeof req.prompt === "string" && req.prompt.trim().length > 0;
}

// Handle CORS preflight
function handleCORS(res: VercelResponse): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return true;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    handleCORS(res);
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST requests are allowed",
    } as ErrorResponse);
    return;
  }

  // Validate request body
  if (!validateRequest(req.body)) {
    res.status(400).json({
      error: "Bad Request",
      message:
        "Invalid request body. 'prompt' is required and must be a non-empty string",
    } as ErrorResponse);
    return;
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set in environment variables");
    res.status(500).json({
      error: "Server Configuration Error",
      message: "API key not configured on server",
      code: "MISSING_API_KEY",
    } as ErrorResponse);
    return;
  }

  // Initialize Groq client (server-side only - secure)
  const groq = new Groq({
    apiKey,
    // No dangerouslyAllowBrowser needed - this runs on server
  });

  try {
    const {
      prompt,
      model = "llama-3.1-8b-instant",
      temperature = 0.7,
      max_tokens = 2500,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
    } = req.body as GroqRequest;

    // Validate prompt length (prevent abuse)
    if (prompt.length > 50000) {
      res.status(400).json({
        error: "Bad Request",
        message: "Prompt is too long. Maximum length is 50,000 characters",
      } as ErrorResponse);
      return;
    }

    const allowedModels = [
      "openai/gpt-oss-120b",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-safeguard-20b",
      "groq/compound",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
    ];

    if (!allowedModels.includes(model)) {
      res.status(400).json({
        error: "Bad Request",
        message: `Model '${model}' is not allowed`,
      } as ErrorResponse);
      return;
    }

    // Model-specific max_tokens limits (if any model needs special limits)
    const modelMaxTokens: Record<string, number> = {
      // Add model-specific limits here if needed
    };

    // Override max_tokens if model has a specific limit
    const effectiveMaxTokens = modelMaxTokens[model]
      ? Math.min(max_tokens, modelMaxTokens[model])
      : max_tokens;

    // Validate numeric parameters
    if (
      temperature < 0 ||
      temperature > 2 ||
      max_tokens < 1 ||
      max_tokens > 32000 ||
      top_p < 0 ||
      top_p > 1 ||
      frequency_penalty < -2 ||
      frequency_penalty > 2 ||
      presence_penalty < -2 ||
      presence_penalty > 2
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid parameter values",
      } as ErrorResponse);
      return;
    }

    // Call Groq API
    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: effectiveMaxTokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stream: false,
      n: 1,
      stop: null,
    });

    // Extract response data
    const content = response.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({
        error: "Invalid Response",
        message: "No content in response from Groq API",
      } as ErrorResponse);
      return;
    }

    // Return successful response
    const successResponse: GroqResponse = {
      content,
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens || 0,
            completion_tokens: response.usage.completion_tokens || 0,
            total_tokens: response.usage.total_tokens || 0,
          }
        : undefined,
      model: response.model || model,
    };

    handleCORS(res);
    res.status(200).json(successResponse);
  } catch (error) {
    // Log error server-side (not exposed to client)
    console.error("Groq API Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Rate limit errors
      if (
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        res.status(429).json({
          error: "Rate Limit Exceeded",
          message: "Too many requests. Please try again later.",
          code: "RATE_LIMIT",
        } as ErrorResponse);
        return;
      }

      // Authentication errors
      if (
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        res.status(500).json({
          error: "Authentication Error",
          message: "Invalid API key configuration",
          code: "AUTH_ERROR",
        } as ErrorResponse);
        return;
      }

      // Other Groq API errors
      if (error.message.includes("Groq")) {
        res.status(502).json({
          error: "External Service Error",
          message: "Error communicating with Groq API",
          code: "EXTERNAL_ERROR",
        } as ErrorResponse);
        return;
      }
    }

    // Generic error response (don't expose internal details)
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while processing your request",
      code: "INTERNAL_ERROR",
    } as ErrorResponse);
  }
}
