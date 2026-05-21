import { describe, it, expect } from "vitest";
import { subtotal, cartTotal } from "./cart";

const items = [
  { name: "T-shirt", price: 500, qty: 2 },
  { name: "Mug", price: 150, qty: 1 },
];

describe("cart", () => {
  it("subtotal sums price * qty", () => {
    expect(subtotal(items)).toBe(1150);
  });
  it("cartTotal applies SALE", () => {
    expect(cartTotal(items, "SALE")).toBe(1035);
  });
});
