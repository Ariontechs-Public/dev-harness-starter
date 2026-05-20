// 起始狀態:只支援 SALE。任務是加 VIP。
export function applyDiscount(price: number, code: string): number {
  if (code === 'SALE') return price * 0.9;
  return price;
}
