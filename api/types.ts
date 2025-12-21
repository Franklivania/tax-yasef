/**
 * Shared types for API requests and responses
 * Can be imported by both frontend and backend
 */

export interface GroqRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface GroqResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}
