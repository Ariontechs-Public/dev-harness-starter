# Cross-Model Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A thin, hermetic TypeScript runner that drives this repo's task files through each model with the harness ON vs OFF, runs the real gate on produced code, and writes a comparison matrix.

**Architecture:** One-turn generation per `(task × model × mode)` via the Vercel AI SDK (mirrors how opencode reaches many providers). The harness ON/OFF difference is *only* `{CLAUDE.md + DoR text}`; everything else (task text, output-format note) is held constant for a fair comparison. For code-producing tasks, the runner backs up `sample-app/src/discount.ts`, writes the model's candidate, runs the real `gate/gate.sh`, then restores. Results render to a markdown matrix.

**Tech Stack:** Node 24, TypeScript, `tsx` (run TS directly), `vitest` (tests), Vercel AI SDK (`ai`) with `@openrouter/ai-sdk-provider` (default, one key → many vendors) and `@ai-sdk/anthropic` (direct, optional).

**Spec:** `docs/specs/2026-05-22-cross-model-runner-design.md`. Refinement: gate uses in-place backup/restore (not a temp copy) because `gate/gate.sh` targets `../sample-app` by relative path.

---

## File Structure

All new code lives under `runner/` and touches nothing in `sample-app/`, `gate/`, `CLAUDE.md`, or `.claude/`.

```
runner/
  package.json        # own deps + scripts; "type": "module"
  tsconfig.json       # ESM, strict
  src/
    types.ts          # shared types (Mode, Task, ModelSpec, RunResult)
    tasks.ts          # which TASK-*.md to sweep + whether each produces code
    harness.ts        # buildMessages(task, mode) -> { system, prompt }
    classify.ts       # classifyReply(text) -> { askedFirst, code | null }
    gate.ts           # applyAndGate(code) -> { gatePassed, output } (backup/restore)
    models.ts         # resolveModels() -> ModelSpec[] (env-keyed, skips missing)
    callModel.ts      # callModel(spec, system, prompt) -> string (AI SDK)
    report.ts         # renderMatrix(results) -> markdown; writeReport(...)
    run.ts            # entry: sweep, collect, write docs/runs/<ts>.md
  src/*.test.ts       # vitest unit/integration tests
  README.md           # usage + env keys
```

---

### Task 1: Scaffold the runner package

**Files:**
- Create: `runner/package.json`
- Create: `runner/tsconfig.json`
- Create: `runner/.gitignore`
- Create: `runner/src/types.ts`

- [ ] **Step 1: Create `runner/package.json`**

```json
{
  "name": "cross-model-runner",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "run": "tsx src/run.ts"
  },
  "dependencies": {
    "ai": "^5.0.0",
    "@openrouter/ai-sdk-provider": "^1.0.0",
    "@ai-sdk/anthropic": "^2.0.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

> Note for the implementer: pin exact versions at install time from the registry; the AI SDK's generation params (`maxTokens` vs `maxOutputTokens`) differ between v4 and v5 — see Task 6 and confirm against the installed version.

- [ ] **Step 2: Create `runner/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `runner/.gitignore`**

```
node_modules/
.env
```

- [ ] **Step 4: Create `runner/src/types.ts`**

```ts
export type Mode = "off" | "on";

export interface Task {
  id: string;          // e.g. "coupon"
  file: string;        // repo-relative, e.g. "TASK-coupon.md"
  producesCode: boolean;
}

export interface ModelSpec {
  id: string;          // label for the report, e.g. "openrouter:anthropic/claude-3.5-sonnet"
  make: () => unknown; // returns an AI SDK LanguageModel (typed loosely to avoid SDK coupling here)
}

export interface RunResult {
  taskId: string;
  modelId: string;
  mode: Mode;
  askedFirst: boolean;
  gate: "pass" | "fail" | "n/a" | "apply-error" | "error";
  note?: string;       // error text or short detail
}
```

- [ ] **Step 5: Install and verify**

Run: `cd runner && npm install && npx tsc --noEmit`
Expected: install succeeds; `tsc` prints nothing (exit 0).

- [ ] **Step 6: Commit**

```bash
git add runner/package.json runner/tsconfig.json runner/.gitignore runner/src/types.ts
git commit -m "feat(runner): scaffold cross-model runner package"
```

---

### Task 2: Harness prompt builder

The harness ON/OFF difference is exactly `{repo CLAUDE.md + DoR text}`. The DoR text is sourced by executing `gate/dor-reminder.sh` so it always matches the real hook. An identical output-format note is appended in BOTH modes for code tasks, so it is a constant, not part of the manipulation.

**Files:**
- Create: `runner/src/harness.ts`
- Test: `runner/src/harness.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// runner/src/harness.test.ts
import { describe, it, expect } from "vitest";
import { buildMessages } from "./harness";
import type { Task } from "./types";

const coupon: Task = { id: "coupon", file: "TASK-coupon.md", producesCode: true };
const repoRoot = new URL("../../", import.meta.url).pathname;

describe("buildMessages", () => {
  it("ON includes CLAUDE.md content and the DoR reminder", () => {
    const { system } = buildMessages(coupon, "on", repoRoot);
    expect(system).toContain("Definition of Ready"); // from CLAUDE.md / DoR
    expect(system).toContain("[DoR 提醒]");           // from gate/dor-reminder.sh
  });

  it("OFF includes neither CLAUDE.md nor the DoR reminder", () => {
    const { system } = buildMessages(coupon, "off", repoRoot);
    expect(system).not.toContain("Definition of Ready");
    expect(system).not.toContain("[DoR 提醒]");
  });

  it("both modes carry the same task text in the prompt", () => {
    const on = buildMessages(coupon, "on", repoRoot);
    const off = buildMessages(coupon, "off", repoRoot);
    expect(on.prompt).toContain("SAVE200");
    expect(off.prompt).toBe(on.prompt);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && npx vitest run src/harness.test.ts`
Expected: FAIL — `buildMessages` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// runner/src/harness.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd runner && npx vitest run src/harness.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add runner/src/harness.ts runner/src/harness.test.ts
git commit -m "feat(runner): harness ON/OFF prompt builder"
```

---

### Task 3: Reply classifier

Detects whether the model asked a clarifying question instead of acting, and extracts a fenced `ts` code block if present. Heuristic — flagged as an open question in the spec; refine against real outputs later.

**Files:**
- Create: `runner/src/classify.ts`
- Test: `runner/src/classify.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// runner/src/classify.test.ts
import { describe, it, expect } from "vitest";
import { classifyReply } from "./classify";

describe("classifyReply", () => {
  it("flags a clarifying question with no code as askedFirst", () => {
    const r = classifyReply("總額可以變負嗎?四捨五入到幾位?先確認再動工。");
    expect(r.askedFirst).toBe(true);
    expect(r.code).toBeNull();
  });

  it("extracts a fenced ts block and is not askedFirst", () => {
    const text = "Sure:\n```ts\nexport function applyDiscount(){ return 0; }\n```";
    const r = classifyReply(text);
    expect(r.askedFirst).toBe(false);
    expect(r.code).toContain("applyDiscount");
  });

  it("plain prose with no question and no code is not askedFirst", () => {
    const r = classifyReply("I updated the function.");
    expect(r.askedFirst).toBe(false);
    expect(r.code).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && npx vitest run src/classify.test.ts`
Expected: FAIL — `classifyReply` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// runner/src/classify.ts
const FENCE = /```(?:ts|typescript)?\s*\n([\s\S]*?)```/i;

export function classifyReply(text: string): { askedFirst: boolean; code: string | null } {
  const m = text.match(FENCE);
  const code = m ? m[1].trim() : null;
  // askedFirst: produced no code AND the reply reads as a question/clarification request.
  const looksLikeQuestion = /[??]/.test(text) ||
    /(規格|重現|複現|clarif|spec|reproduc)/i.test(text);
  const askedFirst = code === null && looksLikeQuestion;
  return { askedFirst, code };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd runner && npx vitest run src/classify.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add runner/src/classify.ts runner/src/classify.test.ts
git commit -m "feat(runner): reply classifier (askedFirst + code extraction)"
```

---

### Task 4: Gate runner (backup → write → real gate → restore)

Writes a candidate `discount.ts`, runs the real `gate/gate.sh`, and ALWAYS restores the original. Reuses the installed `sample-app` (node_modules already present).

**Files:**
- Create: `runner/src/gate.ts`
- Test: `runner/src/gate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// runner/src/gate.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyAndGate } from "./gate";

const repoRoot = new URL("../../", import.meta.url).pathname;
const discountPath = join(repoRoot, "sample-app/src/discount.ts");
const original = readFileSync(discountPath, "utf8");

const GOOD = `const money = (x: number): number => Math.round(x * 100) / 100;
export function applyDiscount(price: number, code: string): number {
  if (code === "SALE") return money(price * 0.9);
  if (code === "VIP") return money(price * 0.8);
  if (code === "SAVE200") return money(Math.max(0, price - 200));
  return price;
}`;

const BAD = GOOD.replace("Math.max(0, price - 200)", "price - 200");

describe("applyAndGate", () => {
  it("passes for a correct SAVE200 implementation", () => {
    const r = applyAndGate(GOOD, repoRoot);
    expect(r.gatePassed).toBe(true);
  });

  it("fails the gate for the negative-total latent bug", () => {
    const r = applyAndGate(BAD, repoRoot);
    expect(r.gatePassed).toBe(false);
    expect(r.output).toMatch(/test gate failed|✗/);
  });

  it("always restores the original discount.ts", () => {
    expect(readFileSync(discountPath, "utf8")).toBe(original);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && npx vitest run src/gate.test.ts`
Expected: FAIL — `applyAndGate` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// runner/src/gate.ts
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
    writeFileSync(target, backup); // restore no matter what
  }
}
```

> `gate.sh` writes its banners to stderr and exits 2 on failure; `execFileSync` throws on non-zero exit, and we capture both streams from the thrown error.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd runner && npx vitest run src/gate.test.ts`
Expected: PASS (3 tests). The middle test runs the real gate and sees the invariant test fail.

- [ ] **Step 5: Verify the working tree is clean (restore worked)**

Run: `git status --short sample-app/src/discount.ts`
Expected: empty output (file unchanged).

- [ ] **Step 6: Commit**

```bash
git add runner/src/gate.ts runner/src/gate.test.ts
git commit -m "feat(runner): gate runner with backup/restore against real gate.sh"
```

---

### Task 5: Model resolution (env-keyed, skip missing)

Returns the model specs whose API key is present; missing-key models are skipped (the report notes them). Default sweep uses OpenRouter (one key, many vendors); a direct Anthropic entry is included and only activates when `ANTHROPIC_API_KEY` is set.

**Files:**
- Create: `runner/src/models.ts`
- Create: `runner/src/callModel.ts`
- Test: `runner/src/models.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// runner/src/models.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveModels } from "./models";

const saved = { ...process.env };
beforeEach(() => { delete process.env.OPENROUTER_API_KEY; delete process.env.ANTHROPIC_API_KEY; });
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && npx vitest run src/models.test.ts`
Expected: FAIL — `resolveModels` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// runner/src/models.ts
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ModelSpec } from "./types";

// The sweep list. Add/remove provider/model strings here.
const OPENROUTER_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-001",
];

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

  return specs;
}
```

```ts
// runner/src/callModel.ts
import { generateText, type LanguageModel } from "ai";
import type { ModelSpec } from "./types";

export async function callModel(spec: ModelSpec, system: string, prompt: string): Promise<string> {
  const model = spec.make() as LanguageModel;
  const { text } = await generateText({ model, system, prompt });
  return text;
}
```

> Confirm `generateText`'s shape against the installed `ai` version. v5 uses `{ model, system, prompt }` and returns `{ text }`. If you pin a token cap, v5's param is `maxOutputTokens`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd runner && npx vitest run src/models.test.ts`
Expected: PASS (2 tests). (`callModel` has no unit test — exercised in the manual smoke run.)

- [ ] **Step 5: Commit**

```bash
git add runner/src/models.ts runner/src/callModel.ts runner/src/models.test.ts
git commit -m "feat(runner): env-keyed model resolution + AI SDK call wrapper"
```

---

### Task 6: Report matrix

Renders `RunResult[]` into a markdown matrix and writes it to `docs/runs/<timestamp>.md`.

**Files:**
- Create: `runner/src/report.ts`
- Test: `runner/src/report.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// runner/src/report.test.ts
import { describe, it, expect } from "vitest";
import { renderMatrix } from "./report";
import type { RunResult } from "./types";

const results: RunResult[] = [
  { taskId: "coupon", modelId: "openrouter:anthropic/claude-3.5-sonnet", mode: "off", askedFirst: false, gate: "fail" },
  { taskId: "coupon", modelId: "openrouter:anthropic/claude-3.5-sonnet", mode: "on",  askedFirst: false, gate: "pass" },
];

describe("renderMatrix", () => {
  it("renders one row per model with OFF and ON columns", () => {
    const md = renderMatrix(results);
    expect(md).toContain("openrouter:anthropic/claude-3.5-sonnet");
    expect(md).toContain("OFF");
    expect(md).toContain("ON");
    expect(md).toContain("fail");
    expect(md).toContain("pass");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && npx vitest run src/report.test.ts`
Expected: FAIL — `renderMatrix` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// runner/src/report.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd runner && npx vitest run src/report.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add runner/src/report.ts runner/src/report.test.ts
git commit -m "feat(runner): markdown comparison matrix report"
```

---

### Task 7: Orchestrator + task config

Ties it together: for each `(task × model × mode)`, build messages, call the model, classify, gate if code-producing, collect results, write the report.

**Files:**
- Create: `runner/src/tasks.ts`
- Create: `runner/src/run.ts`

- [ ] **Step 1: Create `runner/src/tasks.ts`**

```ts
// runner/src/tasks.ts
import type { Task } from "./types";

export const TASKS: Task[] = [
  { id: "bug",    file: "TASK-bug.md",    producesCode: false },
  { id: "coupon", file: "TASK-coupon.md", producesCode: true },
];
```

- [ ] **Step 2: Create `runner/src/run.ts`**

```ts
// runner/src/run.ts
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
```

- [ ] **Step 3: Typecheck the whole runner**

Run: `cd runner && npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 4: Run the full test suite**

Run: `cd runner && npm test`
Expected: all suites PASS (harness, classify, gate, models, report).

- [ ] **Step 5: Commit**

```bash
git add runner/src/tasks.ts runner/src/run.ts
git commit -m "feat(runner): sweep orchestrator + task config"
```

---

### Task 8: Usage doc + manual smoke run

**Files:**
- Create: `runner/README.md`

- [ ] **Step 1: Create `runner/README.md`**

````markdown
# Cross-Model Runner

Drives this repo's task files through each model with the harness ON vs OFF,
runs the real gate on produced code, and writes a comparison matrix to
`docs/runs/<timestamp>.md`. Hermetic: builds its own system prompt, never loads
your `~/.claude` skills or hooks.

## Setup

```bash
cd runner && npm install
```

Set at least one key (env vars only, never committed):

```bash
export OPENROUTER_API_KEY=...   # one key → Claude / GPT / Gemini
export ANTHROPIC_API_KEY=...    # optional, direct Anthropic
```

## Run

```bash
cd runner && npm run run
```

Edit the sweep in `src/models.ts` (which models) and `src/tasks.ts` (which tasks).

## Test

```bash
cd runner && npm test
```

`gate.test.ts` runs the real `gate/gate.sh` against known-good/known-bad
implementations and restores `sample-app/src/discount.ts` afterward.
````

- [ ] **Step 2: Manual smoke run (needs a key + tokens — not automated)**

Run: `export OPENROUTER_API_KEY=... && cd runner && npm run run`
Expected: per-combo lines on stderr, then `Report written to docs/runs/<ts>.md`.
Verify: open the report — for `coupon`, expect OFF more likely `gate=fail` and ON more likely `asked=Y` or `gate=pass`.

- [ ] **Step 3: Confirm the working tree is clean after a run**

Run: `git status --short sample-app/`
Expected: empty (gate runner restored discount.ts).

- [ ] **Step 4: Commit**

```bash
git add runner/README.md
git commit -m "docs(runner): usage and manual smoke-run instructions"
```

---

## Self-Review

**Spec coverage:**
- Hermetic, no client skills/hooks → harness.ts builds its own system; never reads `~/.claude` (Task 2). ✓
- Cross-model via AI SDK, `provider/model` strings → models.ts + callModel.ts (Task 5). ✓
- Harness ON = CLAUDE.md + DoR; OFF = bare → Task 2. ✓
- One-turn + post-hoc gate → run.ts + gate.ts (Tasks 4, 7). ✓
- `askedFirst` classification → classify.ts (Task 3); heuristic noted as open question. ✓
- Comparison matrix to `docs/runs/` → report.ts (Task 6). ✓
- Error handling: missing key skipped (models.ts), call error recorded, apply-error recorded, best-effort report (run.ts). ✓
- Tests: harness, gate (good/bad fixtures + real gate), report snapshot, models → Tasks 2–6. ✓
- Does not touch sample-app/gate/CLAUDE.md/.claude → all new files under `runner/`. ✓

**Deviation from spec (intentional):** gate uses in-place backup/restore instead of a temp copy, because `gate/gate.sh` resolves `../sample-app` by relative path. Update the spec's gate.ts section to match, or keep the note in this plan's header.

**Placeholder scan:** none — every code/test step has complete content. The two "confirm against installed version" notes (AI SDK param names, version pins) are external-dependency verification, not logic placeholders.

**Type consistency:** `Mode`, `Task`, `ModelSpec`, `RunResult` defined in `types.ts` (Task 1) and used consistently. `buildMessages → {system, prompt}`, `classifyReply → {askedFirst, code}`, `applyAndGate → {gatePassed, output}`, `resolveModels → ModelSpec[]`, `callModel(spec, system, prompt) → string`, `renderMatrix(results) → string` all line up across tasks.
