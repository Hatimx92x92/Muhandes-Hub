// =============================================================================
// Test: Subscription Limit Enforcement (#340)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { TIER_LIMITS, type TierLimits } from '@/types';

// ---------------------------------------------------------------------------
// TIER_LIMITS structure tests
// ---------------------------------------------------------------------------
describe('TIER_LIMITS structure', () => {
  const TIERS = ['starter', 'pro', 'business', 'enterprise'] as const;

  it('defines all 4 tiers', () => {
    for (const tier of TIERS) {
      expect(TIER_LIMITS[tier]).toBeDefined();
    }
  });

  it('each tier has all required limit properties', () => {
    const requiredKeys: (keyof TierLimits)[] = [
      'bidsPerMonth', 'productPosts', 'crmClients', 'quotationsPerMonth',
      'contractsPerMonth', 'commissionRate', 'hasKanban', 'hasAnalytics',
      'hasBulkUpload', 'hasClauseLibrary', 'hasCustomContracts',
    ];
    for (const tier of TIERS) {
      for (const key of requiredKeys) {
        expect(TIER_LIMITS[tier]).toHaveProperty(key);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Bid limits per tier
// ---------------------------------------------------------------------------
describe('Bid limits', () => {
  it('starter: 10 bids/month', () => {
    expect(TIER_LIMITS['starter'].bidsPerMonth).toBe(10);
  });

  it('pro: 50 bids/month', () => {
    expect(TIER_LIMITS['pro'].bidsPerMonth).toBe(50);
  });

  it('business: 100 bids/month', () => {
    expect(TIER_LIMITS['business'].bidsPerMonth).toBe(100);
  });

  it('enterprise: unlimited bids', () => {
    expect(TIER_LIMITS['enterprise'].bidsPerMonth).toBe(Infinity);
  });

  it('tiers increase monotonically', () => {
    expect(TIER_LIMITS['starter'].bidsPerMonth)
      .toBeLessThan(TIER_LIMITS['pro'].bidsPerMonth);
    expect(TIER_LIMITS['pro'].bidsPerMonth)
      .toBeLessThan(TIER_LIMITS['business'].bidsPerMonth);
    expect(TIER_LIMITS['business'].bidsPerMonth)
      .toBeLessThan(TIER_LIMITS['enterprise'].bidsPerMonth);
  });
});

// ---------------------------------------------------------------------------
// Product post limits per tier
// ---------------------------------------------------------------------------
describe('Product post limits', () => {
  it('starter: 2 products', () => {
    expect(TIER_LIMITS['starter'].productPosts).toBe(2);
  });

  it('pro: 10 products', () => {
    expect(TIER_LIMITS['pro'].productPosts).toBe(10);
  });

  it('business: 50 products', () => {
    expect(TIER_LIMITS['business'].productPosts).toBe(50);
  });

  it('enterprise: unlimited products', () => {
    expect(TIER_LIMITS['enterprise'].productPosts).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// CRM client limits per tier
// ---------------------------------------------------------------------------
describe('CRM client limits', () => {
  it('starter: 20 clients', () => {
    expect(TIER_LIMITS['starter'].crmClients).toBe(20);
  });

  it('pro: 200 clients', () => {
    expect(TIER_LIMITS['pro'].crmClients).toBe(200);
  });

  it('business: unlimited', () => {
    expect(TIER_LIMITS['business'].crmClients).toBe(Infinity);
  });

  it('enterprise: unlimited', () => {
    expect(TIER_LIMITS['enterprise'].crmClients).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// Quotation limits
// ---------------------------------------------------------------------------
describe('Quotation limits', () => {
  it('starter: 3/month', () => {
    expect(TIER_LIMITS['starter'].quotationsPerMonth).toBe(3);
  });

  it('pro: 20/month', () => {
    expect(TIER_LIMITS['pro'].quotationsPerMonth).toBe(20);
  });

  it('business: unlimited', () => {
    expect(TIER_LIMITS['business'].quotationsPerMonth).toBe(Infinity);
  });

  it('enterprise: unlimited', () => {
    expect(TIER_LIMITS['enterprise'].quotationsPerMonth).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// Feature availability by tier
// ---------------------------------------------------------------------------
describe('Feature availability', () => {
  it('starter has no Kanban', () => {
    expect(TIER_LIMITS['starter'].hasKanban).toBe(false);
  });

  it('pro has checklist Kanban', () => {
    expect(TIER_LIMITS['pro'].hasKanban).toBe('checklist');
  });

  it('business has full Kanban', () => {
    expect(TIER_LIMITS['business'].hasKanban).toBe('full');
  });

  it('starter has no analytics', () => {
    expect(TIER_LIMITS['starter'].hasAnalytics).toBe(false);
  });

  it('pro has summary analytics', () => {
    expect(TIER_LIMITS['pro'].hasAnalytics).toBe('summary');
  });

  it('business has full analytics', () => {
    expect(TIER_LIMITS['business'].hasAnalytics).toBe('full');
  });

  it('only business+ has bulk upload', () => {
    expect(TIER_LIMITS['starter'].hasBulkUpload).toBe(false);
    expect(TIER_LIMITS['pro'].hasBulkUpload).toBe(false);
    expect(TIER_LIMITS['business'].hasBulkUpload).toBe(true);
    expect(TIER_LIMITS['enterprise'].hasBulkUpload).toBe(true);
  });

  it('only business+ has custom contracts', () => {
    expect(TIER_LIMITS['starter'].hasCustomContracts).toBe(false);
    expect(TIER_LIMITS['pro'].hasCustomContracts).toBe(false);
    expect(TIER_LIMITS['business'].hasCustomContracts).toBe(true);
    expect(TIER_LIMITS['enterprise'].hasCustomContracts).toBe(true);
  });

  it('pro+ has clause library', () => {
    expect(TIER_LIMITS['starter'].hasClauseLibrary).toBe(false);
    expect(TIER_LIMITS['pro'].hasClauseLibrary).toBe(true);
    expect(TIER_LIMITS['business'].hasClauseLibrary).toBe(true);
    expect(TIER_LIMITS['enterprise'].hasClauseLibrary).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Limit enforcement logic (the pattern used in server actions)
// ---------------------------------------------------------------------------
describe('Limit enforcement logic', () => {
  function isOverLimit(currentCount: number, tier: string, limitKey: keyof TierLimits): boolean {
    const limit = TIER_LIMITS[tier]?.[limitKey];
    if (typeof limit !== 'number') return false;
    if (limit === Infinity) return false;
    return currentCount >= limit;
  }

  it('starter at 10 bids is over limit', () => {
    expect(isOverLimit(10, 'starter', 'bidsPerMonth')).toBe(true);
  });

  it('starter at 9 bids is not over limit', () => {
    expect(isOverLimit(9, 'starter', 'bidsPerMonth')).toBe(false);
  });

  it('enterprise at 10000 bids is never over limit (Infinity)', () => {
    expect(isOverLimit(10000, 'enterprise', 'bidsPerMonth')).toBe(false);
  });

  it('pro at 10 products (supplier) is at limit', () => {
    expect(isOverLimit(10, 'pro', 'productPosts')).toBe(true);
  });

  it('business at 199 CRM clients: not over limit (Infinity)', () => {
    expect(isOverLimit(199, 'business', 'crmClients')).toBe(false);
  });

  it('starter at 3 quotations is at limit', () => {
    expect(isOverLimit(3, 'starter', 'quotationsPerMonth')).toBe(true);
  });

  it('unknown tier returns false (no limits found)', () => {
    expect(isOverLimit(100, 'invalid_tier', 'bidsPerMonth')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Commission rates are consistent between TIER_LIMITS
// ---------------------------------------------------------------------------
describe('Commission rates consistency', () => {
  it('starter: 2%', () => {
    expect(TIER_LIMITS['starter'].commissionRate).toBe(0.02);
  });

  it('pro: 1%', () => {
    expect(TIER_LIMITS['pro'].commissionRate).toBe(0.01);
  });

  it('business: 0%', () => {
    expect(TIER_LIMITS['business'].commissionRate).toBe(0);
  });

  it('enterprise: 0%', () => {
    expect(TIER_LIMITS['enterprise'].commissionRate).toBe(0);
  });

  it('commission decreases with higher tiers', () => {
    expect(TIER_LIMITS['starter'].commissionRate)
      .toBeGreaterThan(TIER_LIMITS['pro'].commissionRate);
    expect(TIER_LIMITS['pro'].commissionRate)
      .toBeGreaterThan(TIER_LIMITS['business'].commissionRate);
    expect(TIER_LIMITS['business'].commissionRate)
      .toBe(TIER_LIMITS['enterprise'].commissionRate);
  });
});
