import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { RunResult } from "./types";

function cell(r: RunResult | undefined): string {
  if (!r) return "—";
  return `asked=${r.askedFirst ? "Y" : "N"} gate=${r.gate}`;
}

export function renderMatrix(results: RunResult[]): string {
  const tasks = [...new Set(results.map((r) => r.taskId))];
  const models = [...new Set(results.map((r) => r.modelId))];
  const find = (m: string, t: string, mode: "off" | "on") =>
    results.find((r) => r.modelId === m && r.taskId === t && r.mode === mode);

  let md = "# Cross-Model Run\n\n";
  for (const t of tasks) {
    md += `## Task: ${t}\n\n`;
    md += "| Model | OFF (naive) | ON (harness) |\n|---|---|---|\n";
    for (const m of models) {
      md += `| ${m} | ${cell(find(m, t, "off"))} | ${cell(find(m, t, "on"))} |\n`;
    }
    md += "\n";
  }
  return md;
}

export function writeReport(results: RunResult[], repoRoot: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const dir = join(repoRoot, "docs/runs");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${ts}.md`);
  writeFileSync(path, renderMatrix(results));
  return path;
}
