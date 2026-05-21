import { describe, it, expect } from "vitest";
import { applyDiscount } from "./discount";

// 不變量:任何折扣碼套用後,金額都不該變成負的。
// SAVE200 是固定折 200 元的券 —— 小額購物車很容易讓總額變負;
// 直覺寫法 price - 200 少了 floor 就會中招,而 happy-path(大額)測不到。
describe("applyDiscount (invariants)", () => {
  it("折扣後金額不為負(SAVE200 小額購物車)", () => {
    expect(applyDiscount(150, "SAVE200")).toBeGreaterThanOrEqual(0);
  });
});
