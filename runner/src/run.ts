import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
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

// Debug aid: dump every raw model reply so the heuristic classifier can be
// calibrated against what models actually say.
function writeReplies(rows: { label: string; reply: string }[]): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const dir = join(repoRoot, "docs/runs");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${stamp}-replies.md`);
  let md = "# Cross-Model Run — raw replies\n\n";
  for (const r of rows) {
    md += `## ${r.label}\n\n~~~\n${r.reply.replace(/~~~/g, "≈≈≈")}\n~~~\n\n`;
  }
  writeFileSync(path, md);
  return path;
}

async function main() {
  const models = resolveModels();
  if (models.length === 0) {
    console.error("No models resolved. Set OPENROUTER_API_KEY (and/or ANTHROPIC_API_KEY).");
    process.exit(1);
  }

  const results: RunResult[] = [];
  const replies: { label: string; reply: string }[] = [];
  for (const task of TASKS) {
    for (const model of models) {
      for (const mode of MODES) {
        const { system, prompt } = buildMessages(task, mode, repoRoot);
        const base = { taskId: task.id, modelId: model.id, mode };
        const label = `${task.id} / ${model.id} / ${mode}`;
        try {
          const text = await callModel(model, system, prompt);
          replies.push({ label, reply: text });
          const { askedFirst, code } = classifyReply(text);
          let gate: RunResult["gate"] = "n/a";
          if (task.producesCode && code) {
            gate = applyAndGate(code, repoRoot).gatePassed ? "pass" : "fail";
          } else if (task.producesCode && !code) {
            gate = askedFirst ? "n/a" : "apply-error";
          }
          results.push({ ...base, askedFirst, gate });
          console.error(`✓ ${label}: asked=${askedFirst} gate=${gate}`);
        } catch (e) {
          replies.push({ label, reply: `ERROR: ${String(e)}` });
          results.push({ ...base, askedFirst: false, gate: "error", note: String(e) });
          console.error(`✗ ${label}: ${String(e)}`);
        }
      }
    }
  }

  const path = writeReport(results, repoRoot);
  const repliesPath = writeReplies(replies);
  console.error(`\nReport written to ${path}`);
  console.error(`Replies written to ${repliesPath}`);
}

main();
