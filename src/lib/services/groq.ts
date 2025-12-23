/**
 * Groq Service - Frontend Client
 * Calls secure backend API instead of Groq directly
 */

import { useModelStore } from "../store/useModelStore";
import { useTokenUsageStore } from "../store/useTokenUsageStore";
import {
  checkRateLimit,
  getCSRFHeader,
  sanitizeInput,
  containsDangerousContent,
} from "../utils/security";

// Type definitions matching backend
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

/**
 * Estimate tokens in text
 * More accurate estimation: ~4 characters per token for English text
 * Accounts for spaces and punctuation
 */
const estimateTokens = (text: string): number => {
  if (!text || text.length === 0) return 0;
  // More accurate: count words and add overhead for punctuation/spaces
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Average: ~1.3 tokens per word, or ~4 chars per token
  return Math.ceil(Math.max(words * 1.3, chars / 4));
};

export class TokenLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenLimitError";
  }
}

/**
 * Get API endpoint URL
 * In development: uses localhost or Vercel dev server
 * In production: uses deployed Vercel function
 */
function getApiUrl(): string {
  // In development, Vercel CLI proxies /api to serverless functions
  // In production, this will be the deployed Vercel URL
  if (import.meta.env.DEV) {
    // Development: Vercel dev server or local proxy
    return "/api/groq";
  }
  // Production: Use relative path (same domain)
  return "/api/groq";
}

/**
 * Create completion by calling secure backend API
 */
const createCompletion = async (
  prompt: string,
  systemPrompt?: string
): Promise<string> => {
  // Sanitize input to prevent XSS
  const sanitizedPrompt = sanitizeInput(prompt);

  // Check for dangerous content
  if (containsDangerousContent(sanitizedPrompt)) {
    throw new Error(
      "Input contains potentially dangerous content. Please try again."
    );
  }

  const tokenStore = useTokenUsageStore.getState();
  const modelStore = useModelStore.getState();
  const currentModel = modelStore.model;
  const currentModelValue = modelStore.getModelValue();

  // Model-specific max_tokens limits (if any model needs special limits)
  const modelMaxTokens: Record<string, number> = {
    // Add model-specific limits here if needed (default 2500)
  };

  // Get the appropriate max_tokens for the current model
  const maxTokens = modelMaxTokens[currentModelValue] || 2500;

  tokenStore.resetIfNeeded();

  // Frontend rate limiting (per model)
  const rateLimitResult = checkRateLimit({
    maxRequests: 30, // 30 requests per window
    windowMs: 60000, // 1 minute window
    key: `api-${currentModel}`,
  });

  if (!rateLimitResult.allowed) {
    const resetInSeconds = Math.ceil(rateLimitResult.resetIn / 1000);
    throw new TokenLimitError(
      `Rate limit exceeded. Please wait ${resetInSeconds} seconds before trying again.`
    );
  }

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\nUser: ${sanitizedPrompt}\n\nAssistant:`
    : sanitizedPrompt;

  // More accurate token estimation:
  // - Input tokens: actual prompt length
  // - Output tokens: use 50% of maxTokens as average (not worst case)
  // This prevents overestimation that causes false limit failures
  const inputTokens = estimateTokens(fullPrompt);
  const estimatedOutputTokens = Math.ceil(maxTokens * 0.5); // Assume average response, not max
  const estimatedTokens = inputTokens + estimatedOutputTokens;

  // Check token limits before making request
  if (!tokenStore.canUse(currentModel, estimatedTokens)) {
    const remaining = tokenStore.getRemaining(currentModel);
    throw new TokenLimitError(
      `Token limit exceeded for ${currentModel}. Remaining: ${remaining} tokens. Try switching models.`
    );
  }

  try {
    // Prepare request
    const requestBody: GroqRequest = {
      prompt: fullPrompt,
      model: modelStore.getModelValue(),
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    // Get CSRF token header
    const csrfHeaders = getCSRFHeader();

    // Call backend API (secure - API key is on server)
    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaders,
      },
      body: JSON.stringify(requestBody),
      credentials: "same-origin", // Include cookies for CSRF
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = "Failed to get response from server";
      let errorCode: string | undefined;

      try {
        const errorData = (await response.json()) as ErrorResponse;
        errorMessage = errorData.message || errorMessage;
        errorCode = errorData.code;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }

      // Handle specific error codes
      if (response.status === 429) {
        throw new TokenLimitError(
          "Rate limit exceeded. Please try again later."
        );
      }

      if (response.status === 400) {
        throw new Error(errorMessage);
      }

      if (response.status === 500 && errorCode === "MISSING_API_KEY") {
        throw new Error("Server configuration error. Please contact support.");
      }

      throw new TokenLimitError(errorMessage);
    }

    // Parse successful response
    const data = (await response.json()) as GroqResponse;

    if (!data.content) {
      throw new Error("No content in response from server");
    }

    // Track token usage
    const totalTokens =
      data.usage?.total_tokens || estimateTokens(prompt + data.content);

    tokenStore.addUsage(currentModel, totalTokens);

    return data.content;
  } catch (error) {
    // Re-throw TokenLimitError as-is
    if (error instanceof TokenLimitError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new TokenLimitError(
        "Network error. Please check your connection and try again."
      );
    }

    // Handle other errors
    if (error instanceof Error) {
      // Check for rate limit in error message
      if (
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        throw new TokenLimitError(
          "Service temporarily unavailable. Please try again later."
        );
      }
      throw error;
    }

    // Unknown error
    throw new TokenLimitError(
      "An unexpected error occurred. Please try again."
    );
  }
};

export const groqService = {
  createCompletion,
};
