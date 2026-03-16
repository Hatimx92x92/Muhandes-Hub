// =============================================================================
// Test: Commission Calculation (#339)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { TIER_LIMITS } from '@/types';

// ---------------------------------------------------------------------------
// Commission rate by tier (pure logic tests)
// ---------------------------------------------------------------------------
const COMMISSION_RATES: Record<string, number> = {
  starter: 0.02,
  pro: 0.01,
  business: 0,
  enterprise: 0,
};

function calculateCommission(dealAmount: number, sellerTier: string): {
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
} {
  const rate = COMMISSION_RATES[sellerTier] ?? 0.02; // default to highest
  const commissionAmount = Math.round(dealAmount * rate * 100) / 100;
  const netAmount = dealAmount - commissionAmount;
  return { commissionRate: rate, commissionAmount, netAmount };
}

describe('Commission rate lookup', () => {
  it('starter tier has 2% commission', () => {
    expect(COMMISSION_RATES['starter']).toBe(0.02);
    expect(TIER_LIMITS['starter'].commissionRate).toBe(0.02);
  });

  it('pro tier has 1% commission', () => {
    expect(COMMISSION_RATES['pro']).toBe(0.01);
    expect(TIER_LIMITS['pro'].commissionRate).toBe(0.01);
  });

  it('business tier has 0% commission', () => {
    expect(COMMISSION_RATES['business']).toBe(0);
    expect(TIER_LIMITS['business'].commissionRate).toBe(0);
  });

  it('enterprise tier has 0% commission', () => {
    expect(COMMISSION_RATES['enterprise']).toBe(0);
    expect(TIER_LIMITS['enterprise'].commissionRate).toBe(0);
  });
});

describe('Commission calculation', () => {
  it('calculates 2% on 100,000 SAR deal for starter', () => {
    const result = calculateCommission(100_000, 'starter');
    expect(result.commissionRate).toBe(0.02);
    expect(result.commissionAmount).toBe(2000);
    expect(result.netAmount).toBe(98_000);
  });

  it('calculates 1% on 100,000 SAR deal for pro', () => {
    const result = calculateCommission(100_000, 'pro');
    expect(result.commissionRate).toBe(0.01);
    expect(result.commissionAmount).toBe(1000);
    expect(result.netAmount).toBe(99_000);
  });

  it('calculates 0% on 100,000 SAR deal for business', () => {
    const result = calculateCommission(100_000, 'business');
    expect(result.commissionRate).toBe(0);
    expect(result.commissionAmount).toBe(0);
    expect(result.netAmount).toBe(100_000);
  });

  it('calculates 0% on 100,000 SAR deal for enterprise', () => {
    const result = calculateCommission(100_000, 'enterprise');
    expect(result.commissionRate).toBe(0);
    expect(result.commissionAmount).toBe(0);
    expect(result.netAmount).toBe(100_000);
  });

  it('handles small amounts without floating point issues', () => {
    const result = calculateCommission(33.33, 'starter');
    // 33.33 * 0.02 = 0.6666 → rounds to 0.67
    expect(result.commissionAmount).toBe(0.67);
    expect(result.netAmount).toBeCloseTo(32.66, 2);
  });

  it('handles zero deal amount', () => {
    const result = calculateCommission(0, 'starter');
    expect(result.commissionAmount).toBe(0);
    expect(result.netAmount).toBe(0);
  });

  it('defaults to starter rate for unknown tier', () => {
    const result = calculateCommission(10000, 'unknown');
    expect(result.commissionRate).toBe(0.02);
    expect(result.commissionAmount).toBe(200);
  });

  it('handles large deal amounts (10M SAR)', () => {
    const result = calculateCommission(10_000_000, 'pro');
    expect(result.commissionAmount).toBe(100_000);
    expect(result.netAmount).toBe(9_900_000);
  });
});

// ---------------------------------------------------------------------------
// VAT on commission (ZATCA 15%)
// ---------------------------------------------------------------------------
describe('Commission VAT calculation', () => {
  const VAT_RATE = 0.15;

  function commissionWithVAT(dealAmount: number, tier: string): {
    commission: number;
    vatOnCommission: number;
    totalDue: number;
  } {
    const { commissionAmount } = calculateCommission(dealAmount, tier);
    const vatOnCommission = Math.round(commissionAmount * VAT_RATE * 100) / 100;
    return {
      commission: commissionAmount,
      vatOnCommission,
      totalDue: commissionAmount + vatOnCommission,
    };
  }

  it('adds 15% VAT on starter commission', () => {
    const result = commissionWithVAT(100_000, 'starter');
    expect(result.commission).toBe(2000);
    expect(result.vatOnCommission).toBe(300);
    expect(result.totalDue).toBe(2300);
  });

  it('adds 15% VAT on pro commission', () => {
    const result = commissionWithVAT(100_000, 'pro');
    expect(result.commission).toBe(1000);
    expect(result.vatOnCommission).toBe(150);
    expect(result.totalDue).toBe(1150);
  });

  it('zero commission means zero VAT for business/enterprise', () => {
    const result = commissionWithVAT(100_000, 'business');
    expect(result.commission).toBe(0);
    expect(result.vatOnCommission).toBe(0);
    expect(result.totalDue).toBe(0);
  });
});
