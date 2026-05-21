import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

export function applyAndGate(code: string, repoRoot: string): { gatePassed: boolean; output: string } {
  const target = join(repoRoot, "sample-app/src/discount.ts");
  const backup = readFileSync(target, "utf8");
  try {
    writeFileSync(target, code.endsWith("\n") ? code : code + "\n");
    try {
      const out = execFileSync("bash", [join(repoRoot, "gate/gate.sh")], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { gatePassed: true, output: out };
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string };
      return { gatePassed: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
    }
  } finally {
    writeFileSync(target, backup);
  }
}
