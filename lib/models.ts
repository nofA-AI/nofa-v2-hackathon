import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

// Create OpenRouter provider instance
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// custom provider with different model settings using OpenRouter:
export const myProvider = customProvider({
  languageModels: {
    "gpt-5.2": wrapLanguageModel({
      model: openrouter.chat("openai/gpt-5.2"),
      middleware: [],
    }),
    "deepseek-r1": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: openrouter.chat("deepseek/deepseek-r1"),
    }),
    "deepseek-r1-distill-llama-70b": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: openrouter.chat("groq/deepseek-r1-distill-llama-70b"),
    }),
  },
});

export type modelID = Parameters<(typeof myProvider)["languageModel"]>["0"];

export const models: Record<modelID, string> = {
  "gpt-5.2": "GPT-5.2",
  "deepseek-r1": "DeepSeek-R1",
  "deepseek-r1-distill-llama-70b": "DeepSeek-R1 Llama 70B",
};
