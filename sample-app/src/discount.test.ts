import { describe, it, expect } from 'vitest';
import { applyDiscount } from './discount.js';

describe('applyDiscount (happy path)', () => {
  it('SALE gives 10% off', () => {
    expect(applyDiscount(100, 'SALE')).toBe(90);
  });
  it('VIP gives 20% off', () => {
    expect(applyDiscount(100, 'VIP')).toBe(80);
  });
  it('unknown code = no discount', () => {
    expect(applyDiscount(100, 'NOPE')).toBe(100);
  });
});
