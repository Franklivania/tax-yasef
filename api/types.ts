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
  userToken?: string;
  ipAddress?: string;
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

// Model types (duplicated from src for serverless functions)
export type Models =
  | "openai/gpt-oss-120b"
  | "llama-3.1-8b-instant"
  | "openai/gpt-oss-safeguard-20b"
  | "groq/compound"
  | "meta-llama/llama-4-maverick-17b-128e-instruct";

export type ModelID =
  | "GPT-4 OSS"
  | "Llama 3.1"
  | "GPT-OSS"
  | "Groq Compound"
  | "Llama 4 Maverick";

export type ModelLimits = {
  tokensPerMin: number;
  tokensPerDay: number;
  requestsPerMin: number;
  requestsPerDay: number;
};

// Total token pool for each model (system-wide allocation)
// Users are allocated tokens from this pool
export const ModelTotalPool: Record<ModelID, number> = {
  "GPT-4 OSS": 2000000, // 2M tokens total pool
  "GPT-OSS": 2000000, // 2M tokens total pool
  "Llama 3.1": 5000000, // 5M tokens total pool
  "Llama 4 Maverick": 5000000, // 5M tokens total pool
  "Groq Compound": 2000000, // 2M tokens total pool
} as const;

export const ModelParams: Record<ModelID, Models> = {
  "GPT-4 OSS": "openai/gpt-oss-120b",
  "Llama 3.1": "llama-3.1-8b-instant",
  "GPT-OSS": "openai/gpt-oss-safeguard-20b",
  "Groq Compound": "groq/compound",
  "Llama 4 Maverick": "meta-llama/llama-4-maverick-17b-128e-instruct",
} as const;

export const ModelLimits: Record<ModelID, ModelLimits> = {
  "GPT-4 OSS": {
    tokensPerMin: 8000,
    tokensPerDay: 200000,
    requestsPerMin: 30,
    requestsPerDay: 1000,
  },
  "GPT-OSS": {
    tokensPerMin: 8000,
    tokensPerDay: 200000,
    requestsPerMin: 30,
    requestsPerDay: 1000,
  },
  "Llama 3.1": {
    tokensPerMin: 6000,
    tokensPerDay: 500000,
    requestsPerMin: 30,
    requestsPerDay: 14400,
  },
  "Llama 4 Maverick": {
    tokensPerMin: 6000,
    tokensPerDay: 500000,
    requestsPerMin: 30,
    requestsPerDay: 1000,
  },
  "Groq Compound": {
    tokensPerMin: 8000,
    tokensPerDay: 200000,
    requestsPerMin: 30,
    requestsPerDay: 250,
  },
} as const;

export const ModelOptions: readonly { label: ModelID; value: Models }[] = [
  { label: "GPT-4 OSS", value: "openai/gpt-oss-120b" },
  { label: "Llama 3.1", value: "llama-3.1-8b-instant" },
  { label: "GPT-OSS", value: "openai/gpt-oss-safeguard-20b" },
  { label: "Groq Compound", value: "groq/compound" },
  {
    label: "Llama 4 Maverick",
    value: "meta-llama/llama-4-maverick-17b-128e-instruct",
  },
] as const;

// Admin types
export type AdminModelUsage = {
  model: ModelID;
  tokensUsedDay: number;
  tokensRemainingDay: number;
  requestsDay: number;
  blocked: boolean;
};

export type AdminUserUsage = {
  userId: string;
  ipAddress: string | null;
  lastActive: number;
  models: AdminModelUsage[];
};

export type AdminUsageStats = {
  model: ModelID;
  tokensUsedDay: number;
  tokensRemainingDay: number;
  requestsDay: number;
};

export type AdminUsageResponse = {
  users: AdminUserUsage[];
  stats: AdminUsageStats[];
};

// KV storage types
export type UserUsageData = {
  userToken: string;
  ipAddress: string | null;
  lastActive: number;
  modelUsage: Record<
    ModelID,
    {
      tokensUsedDay: number;
      tokensRemainingDay: number;
      requestsDay: number;
    }
  >;
};

export type ModelStatsData = {
  model: ModelID;
  totalTokensUsed: number;
  totalRequests: number;
  activeUsers: Set<string>;
  lastUpdated: number;
};
