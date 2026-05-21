import { applyDiscount } from "./discount";

export interface CartItem {
  name: string;
  price: number;
  qty: number;
}

// NOTE: .reduce has no initial value on purpose — this is the demo's latent bug.
// With ≥1 item it works; on an empty cart it throws
// "Reduce of empty array with no initial value". Happy-path tests never hit it.
export function subtotal(items: CartItem[]): number {
  return items.map((i) => i.price * i.qty).reduce((a, b) => a + b);
}

export function cartTotal(items: CartItem[], code: string): number {
  return applyDiscount(subtotal(items), code);
}
