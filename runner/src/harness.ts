import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import type { Task, Mode } from "./types";

const FORMAT_NOTE_CODE =
  "\n\nOUTPUT FORMAT: If you are making the code change, reply with the complete " +
  "updated contents of sample-app/src/discount.ts inside a single ```ts fenced block.";

export function buildMessages(task: Task, mode: Mode, repoRoot: string) {
  const prompt = readFileSync(join(repoRoot, task.file), "utf8");

  if (mode === "off") {
    const system = task.producesCode ? FORMAT_NOTE_CODE.trim() : "";
    return { system, prompt };
  }

  const claudeMd = readFileSync(join(repoRoot, "CLAUDE.md"), "utf8");
  const dor = execFileSync("bash", [join(repoRoot, "gate/dor-reminder.sh")], {
    encoding: "utf8",
  });
  const system = `${claudeMd}\n\n${dor}${task.producesCode ? FORMAT_NOTE_CODE : ""}`;
  return { system, prompt };
}
