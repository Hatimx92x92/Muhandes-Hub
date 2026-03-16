// =============================================================================
// Test: Bid Submission (#337)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { BidSchema, UpdateBidSchema, AwardBidSchema, RejectBidSchema, ShortlistBidSchema } from '@/schemas/bid';

describe('BidSchema validation', () => {
  const validBid = {
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    amount: 50000,
    timeline_days: 30,
    methodology_ar: 'سنقوم بتنفيذ المشروع وفقاً للمعايير',
    methodology_en: 'We will execute according to standards',
  };

  it('accepts valid bid submission', () => {
    const result = BidSchema.safeParse(validBid);
    expect(result.success).toBe(true);
  });

  it('accepts bid with empty methodology (optional)', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      methodology_ar: '',
      methodology_en: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for project_id', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      project_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero timeline_days', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      timeline_days: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer timeline_days', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      timeline_days: 15.5,
    });
    expect(result.success).toBe(false);
  });

  it('coerces string amount to number', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      amount: '75000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(75000);
    }
  });

  it('coerces string timeline_days to integer', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      timeline_days: '45',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeline_days).toBe(45);
    }
  });

  it('rejects short methodology_ar (< 10 chars, when provided)', () => {
    const result = BidSchema.safeParse({
      ...validBid,
      methodology_ar: 'قصير', // 4 chars, less than 10
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateBidSchema validation', () => {
  it('requires bid_id UUID and omits project_id', () => {
    const result = UpdateBidSchema.safeParse({
      bid_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: 60000,
      timeline_days: 45,
    });
    expect(result.success).toBe(true);
  });

  it('rejects without bid_id', () => {
    const result = UpdateBidSchema.safeParse({
      amount: 60000,
      timeline_days: 45,
    });
    expect(result.success).toBe(false);
  });
});

describe('Bid action schemas', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  it('ShortlistBidSchema accepts valid UUID', () => {
    expect(ShortlistBidSchema.safeParse({ bid_id: uuid }).success).toBe(true);
  });

  it('AwardBidSchema accepts valid UUID', () => {
    expect(AwardBidSchema.safeParse({ bid_id: uuid }).success).toBe(true);
  });

  it('RejectBidSchema accepts bid_id with optional reasons', () => {
    const result = RejectBidSchema.safeParse({
      bid_id: uuid,
      reason_ar: 'السعر مرتفع',
      reason_en: 'Price too high',
    });
    expect(result.success).toBe(true);
  });

  it('RejectBidSchema accepts bid_id without reasons', () => {
    const result = RejectBidSchema.safeParse({ bid_id: uuid });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Business rule: contractor classification check logic
// ---------------------------------------------------------------------------
describe('Bid classification check', () => {
  const classOrder: Record<string, number> = { a: 3, b: 2, c: 1 };

  function canBid(contractorClass: string, projectClass: string): boolean {
    return (classOrder[contractorClass] ?? 0) >= (classOrder[projectClass] ?? 0);
  }

  it('class A contractor can bid on A, B, C projects', () => {
    expect(canBid('a', 'a')).toBe(true);
    expect(canBid('a', 'b')).toBe(true);
    expect(canBid('a', 'c')).toBe(true);
  });

  it('class B contractor can bid on B, C but not A', () => {
    expect(canBid('b', 'a')).toBe(false);
    expect(canBid('b', 'b')).toBe(true);
    expect(canBid('b', 'c')).toBe(true);
  });

  it('class C contractor can only bid on C', () => {
    expect(canBid('c', 'a')).toBe(false);
    expect(canBid('c', 'b')).toBe(false);
    expect(canBid('c', 'c')).toBe(true);
  });
});
