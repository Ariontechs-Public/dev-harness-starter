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
