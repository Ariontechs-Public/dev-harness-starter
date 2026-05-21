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
