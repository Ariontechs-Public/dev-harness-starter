import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { ModelSpec } from "./types";

const OPENROUTER_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-001",
];

const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o"];

export function resolveModels(): ModelSpec[] {
  const specs: ModelSpec[] = [];

  if (process.env.OPENROUTER_API_KEY) {
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    for (const id of OPENROUTER_MODELS) {
      specs.push({ id: `openrouter:${id}`, make: () => openrouter(id) });
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    specs.push({ id: "anthropic:claude-3-5-sonnet", make: () => anthropic("claude-3-5-sonnet-latest") });
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    for (const id of OPENAI_MODELS) {
      specs.push({ id: `openai:${id}`, make: () => openai(id) });
    }
  }

  return specs;
}
