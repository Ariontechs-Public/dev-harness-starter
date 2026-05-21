import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { classifyReply } from "./classify";
import { applyAndGate } from "./gate";
import { renderMatrix } from "./report";
import { TASKS } from "./tasks";
import type { Mode, RunResult } from "./types";

export interface Reply {
  taskId: string;
  modelId: string;
  mode: Mode;
  reply: string;
}

// Parse a `*-replies.md` fixture: sections are "## <task> / <model> / <mode>"
// followed by the raw reply inside a ~~~ fence.
export function parseReplies(md: string): Reply[] {
  const out: Reply[] = [];
  for (const part of md.split(/^## /m).slice(1)) {
    const label = part.split("\n")[0].trim();
    const [taskId, modelId, mode] = label.split(" / ").map((s) => s.trim());
    const m = part.match(/~~~\n([\s\S]*?)\n~~~/);
    if (!taskId || !modelId || (mode !== "off" && mode !== "on") || !m) continue;
    out.push({ taskId, modelId, mode, reply: m[1] });
  }
  return out;
}

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m",
};

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixture = fileURLToPath(new URL("../samples/sample-replies.md", import.meta.url));

function outcome(r: Reply, producesCode: boolean): { result: RunResult; line: string } {
  const { askedFirst, code } = classifyReply(r.reply);
  let gate: RunResult["gate"] = "n/a";
  let line: string;
  if (producesCode && code) {
    const passed = applyAndGate(code, repoRoot).gatePassed; // real gate, no API key needed
    gate = passed ? "pass" : "fail";
    line = passed
      ? `${C.yellow}wrote code → gate ✓ PASS${C.reset}`
      : `${C.red}wrote code → gate ✗ FAIL${C.reset}  ${C.dim}← shipped, gate caught it${C.reset}`;
  } else if (askedFirst) {
    line = `${C.green}asked DoR first, held off ✓${C.reset}  ${C.dim}← refused to barrel ahead${C.reset}`;
  } else if (producesCode) {
    gate = "apply-error";
    line = `${C.dim}responded without code or a clear question${C.reset}`;
  } else {
    line = `${C.dim}gave an action plan (didn't ask)${C.reset}`;
  }
  return { result: { taskId: r.taskId, modelId: r.modelId, mode: r.mode, askedFirst, gate }, line };
}

function main() {
  const replies = parseReplies(readFileSync(fixture, "utf8"));
  console.log(`${C.bold}Cross-model harness demo${C.reset} ${C.dim}(replayed from samples/sample-replies.md — no API key needed; gate runs for real)${C.reset}\n`);

  const results: RunResult[] = [];
  for (const task of TASKS) {
    console.log(`${C.cyan}━━━ Task: ${task.id} ━━━${C.reset}`);
    const models = [...new Set(replies.filter((r) => r.taskId === task.id).map((r) => r.modelId))];
    for (const modelId of models) {
      console.log(`  ${C.bold}${modelId}${C.reset}`);
      for (const mode of ["off", "on"] as Mode[]) {
        const r = replies.find((x) => x.taskId === task.id && x.modelId === modelId && x.mode === mode);
        if (!r) continue;
        const { result, line } = outcome(r, task.producesCode);
        results.push(result);
        const tag = mode === "off" ? "OFF (naive)  " : "ON  (harness)";
        console.log(`    ${tag} : ${line}`);
      }
    }
    console.log();
  }

  console.log(`${C.bold}Matrix${C.reset}`);
  console.log(renderMatrix(results));
}

// Only run when executed directly (`tsx src/demo.ts`), never on import — importing
// for `parseReplies` must not trigger the gate (it mutates sample-app/discount.ts).
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
