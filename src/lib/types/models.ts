export type Models = 
  | "openai/gpt-oss-120b"
  | "meta-llama/llama-guard-4-12b"
  | "llama-3.1-8b-instant"
  | "openai/gpt-oss-safeguard-20b"
  | "groq/compound"

export type ModelID = 
  | "GPT-4 OSS"
  | "Llama Guard 4"
  | "Llama 3.1"
  | "GPT-OSS"
  | "Groq Compound"

export type ModelOption = {
  label: ModelID
  value: Models
}

export type ModelLimits = {
  tokensPerMin: number;
  tokensPerDay: number;
  requestsPerMin: number;
  requestsPerDay: number;
}

export const ModelParams: Record<ModelID, Models> = {
  "GPT-4 OSS": "openai/gpt-oss-120b",
  "Llama Guard 4": "meta-llama/llama-guard-4-12b",
  "Llama 3.1": "llama-3.1-8b-instant",
  "GPT-OSS": "openai/gpt-oss-safeguard-20b",
  "Groq Compound": "groq/compound"
} as const

export const ModelLimits: Record<ModelID, ModelLimits> = {
  "GPT-4 OSS": { tokensPerMin: 8000, tokensPerDay: 200000, requestsPerMin: 30, requestsPerDay: 1000 },
  "GPT-OSS": { tokensPerMin: 8000, tokensPerDay: 200000, requestsPerMin: 30, requestsPerDay: 1000 },
  "Llama 3.1": { tokensPerMin: 6000, tokensPerDay: 500000, requestsPerMin: 30, requestsPerDay: 14400 },
  "Llama Guard 4": { tokensPerMin: 15000, tokensPerDay: 500000, requestsPerMin: 30, requestsPerDay: 14400 },
  "Groq Compound": { tokensPerMin: 8000, tokensPerDay: 200000, requestsPerMin: 30, requestsPerDay: 250 },
} as const

export const ModelOptions: readonly ModelOption[] = [
  { label: "GPT-4 OSS", value: "openai/gpt-oss-120b" },
  { label: "Llama Guard 4", value: "meta-llama/llama-guard-4-12b" },
  { label: "Llama 3.1", value: "llama-3.1-8b-instant" },
  { label: "GPT-OSS", value: "openai/gpt-oss-safeguard-20b" },
  { label: "Groq Compound", value: "groq/compound" }
] as const
