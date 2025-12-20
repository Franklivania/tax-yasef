import { Groq } from "groq-sdk";
import { useModelStore } from "../store/useModelStore";
import { useTokenUsageStore } from "../store/useTokenUsageStore";

const groq = new Groq();

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export class TokenLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenLimitError";
  }
}

const createCompletion = async (prompt: string) => {
  const tokenStore = useTokenUsageStore.getState();
  const modelStore = useModelStore.getState();
  const currentModel = modelStore.model;

  tokenStore.resetIfNeeded();

  const estimatedTokens = estimateTokens(prompt) + 2500;

  if (!tokenStore.canUse(currentModel, estimatedTokens)) {
    const remaining = tokenStore.getRemaining(currentModel);
    throw new TokenLimitError(
      `Token limit exceeded for ${currentModel}. Remaining: ${remaining} tokens. Try switching models.`
    );
  }

  try {
    const response = await groq.chat.completions.create({
      model: modelStore.getModelValue(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false,
      n: 1,
      stop: null,
    });

    const usage = response.usage;
    const totalTokens =
      usage?.total_tokens ||
      (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0) ||
      estimateTokens(prompt + (response.choices[0]?.message?.content || ""));

    tokenStore.addUsage(currentModel, totalTokens);
    return response.choices[0].message.content;
  } catch (error) {
    if (error instanceof TokenLimitError) throw error;
    if (error instanceof Error && error.message.includes("rate limit")) {
      throw new TokenLimitError(
        "Service temporarily unavailable. Please try again later."
      );
    }
    throw error;
  }
};

export const groqService = {
  createCompletion,
};
