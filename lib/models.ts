import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI} from "@ai-sdk/openai"
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Create OpenRouter provider instance with custom base URL
const openai = createOpenAI({
  apiKey: process.env.APPLEROUTER_API_KEY,
  baseURL: "https://api.applerouter.ai/v1",
});

// custom provider with different model settings using OpenRouter:
export const myProvider = customProvider({
  languageModels: {
    "openrouter/gpt-5.2": wrapLanguageModel({
      model: openrouter.chat("openai/gpt-5.2"),
      middleware: [],
    }),
    "applerouter/gpt-5.2": wrapLanguageModel({
      model: openai.chat("gpt-5.2"),
      middleware: [],
    }),
  },
});

export type modelID = Parameters<(typeof myProvider)["languageModel"]>["0"];

export const models: Record<modelID, string> = {
  "openrouter/gpt-5.2": "openrouter/gpt-5.2",
  "applerouter/gpt-5.2": "applerouter/gpt-5.2",
};
