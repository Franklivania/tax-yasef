/**
 * Groq Service - Frontend Client
 * Calls secure backend API instead of Groq directly
 */

import { useModelStore } from "../store/useModelStore";
import { useTokenUsageStore } from "../store/useTokenUsageStore";

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

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

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
  const tokenStore = useTokenUsageStore.getState();
  const modelStore = useModelStore.getState();
  const currentModel = modelStore.model;

  tokenStore.resetIfNeeded();

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
    : prompt;
  const estimatedTokens = estimateTokens(fullPrompt) + 2500;

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
      max_tokens: 2500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    // Call backend API (secure - API key is on server)
    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
