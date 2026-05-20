import { describe, it, expect } from 'vitest';
import { applyDiscount } from './discount.js';

// 這些 invariant 是 harness 帶來的「真正的 DoD」。naive 分支沒有它們,
// 所以 naive 的 AI 不會被要求處理 → latent bug。
describe('applyDiscount (invariants)', () => {
  it('never returns a negative price', () => {
    expect(applyDiscount(0, 'VIP')).toBe(0);
  });
  it('rounds money to 2 decimals', () => {
    expect(applyDiscount(9.99, 'VIP')).toBe(7.99);
  });
});
