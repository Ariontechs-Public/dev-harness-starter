const money = (x: number): number => Math.round(x * 100) / 100;

export function applyDiscount(price: number, code: string): number {
  if (code === "SALE") return money(price * 0.9);
  if (code === "VIP") return money(price * 0.8);
  return price;
}
