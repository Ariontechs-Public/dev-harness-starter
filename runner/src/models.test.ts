import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveModels } from "./models";

const saved = { ...process.env };
beforeEach(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});
afterEach(() => { process.env = { ...saved }; });

describe("resolveModels", () => {
  it("returns nothing when no keys are set", () => {
    expect(resolveModels()).toEqual([]);
  });

  it("includes OpenRouter models when OPENROUTER_API_KEY is set", () => {
    process.env.OPENROUTER_API_KEY = "test";
    const ids = resolveModels().map((m) => m.id);
    expect(ids.some((id) => id.startsWith("openrouter:"))).toBe(true);
  });

  it("includes OpenAI models when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test";
    const ids = resolveModels().map((m) => m.id);
    expect(ids.some((id) => id.startsWith("openai:"))).toBe(true);
  });
});
