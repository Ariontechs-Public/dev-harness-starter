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
