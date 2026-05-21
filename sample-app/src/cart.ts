import { applyDiscount } from "./discount";

export interface CartItem {
  name: string;
  price: number;
  qty: number;
}

export function subtotal(items: CartItem[]): number {
  return items.map((i) => i.price * i.qty).reduce((a, b) => a + b);
}

export function cartTotal(items: CartItem[], code: string): number {
  return applyDiscount(subtotal(items), code);
}
