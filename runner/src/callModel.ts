import { generateText, type LanguageModel } from "ai";
import type { ModelSpec } from "./types";

export async function callModel(spec: ModelSpec, system: string, prompt: string): Promise<string> {
  const model = spec.make() as LanguageModel;
  const { text } = await generateText({ model, system, prompt });
  return text;
}
