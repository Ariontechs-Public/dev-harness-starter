import { buildMessages } from "./harness";
import { classifyReply } from "./classify";
import { applyAndGate } from "./gate";
import { resolveModels } from "./models";
import { callModel } from "./callModel";
import { writeReport } from "./report";
import { TASKS } from "./tasks";
import type { Mode, RunResult } from "./types";

const repoRoot = new URL("../../", import.meta.url).pathname;
const MODES: Mode[] = ["off", "on"];

async function main() {
  const models = resolveModels();
  if (models.length === 0) {
    console.error("No models resolved. Set OPENROUTER_API_KEY (and/or ANTHROPIC_API_KEY).");
    process.exit(1);
  }

  const results: RunResult[] = [];
  for (const task of TASKS) {
    for (const model of models) {
      for (const mode of MODES) {
        const { system, prompt } = buildMessages(task, mode, repoRoot);
        const base = { taskId: task.id, modelId: model.id, mode };
        try {
          const text = await callModel(model, system, prompt);
          const { askedFirst, code } = classifyReply(text);
          let gate: RunResult["gate"] = "n/a";
          if (task.producesCode && code) {
            gate = applyAndGate(code, repoRoot).gatePassed ? "pass" : "fail";
          } else if (task.producesCode && !code) {
            gate = askedFirst ? "n/a" : "apply-error";
          }
          results.push({ ...base, askedFirst, gate });
          console.error(`✓ ${task.id} / ${model.id} / ${mode}: asked=${askedFirst} gate=${gate}`);
        } catch (e) {
          results.push({ ...base, askedFirst: false, gate: "error", note: String(e) });
          console.error(`✗ ${task.id} / ${model.id} / ${mode}: ${String(e)}`);
        }
      }
    }
  }

  const path = writeReport(results, repoRoot);
  console.error(`\nReport written to ${path}`);
}

main();
