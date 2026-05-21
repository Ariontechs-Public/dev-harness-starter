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
