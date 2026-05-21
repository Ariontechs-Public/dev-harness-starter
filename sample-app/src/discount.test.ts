import { describe, it, expect } from "vitest";
import { applyDiscount } from "./discount";

describe("applyDiscount", () => {
  it("SALE = 10% off", () => {
    expect(applyDiscount(100, "SALE")).toBe(90);
  });
  it("VIP = 20% off", () => {
    expect(applyDiscount(100, "VIP")).toBe(80);
  });
  it("rounds to 2 decimals", () => {
    expect(applyDiscount(9.99, "VIP")).toBe(7.99);
  });
  it("unknown code = no discount", () => {
    expect(applyDiscount(100, "NOPE")).toBe(100);
  });
});
