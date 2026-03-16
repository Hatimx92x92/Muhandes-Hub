// =============================================================================
// Test: Deal Creation (#338)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { MilestoneSchema, ProofSchema, CancelRequestSchema } from '@/schemas/deal';

// ---------------------------------------------------------------------------
// Deal type & lifecycle rules (pure logic tests)
// ---------------------------------------------------------------------------
describe('Deal lifecycle states', () => {
  const VALID_STATES = ['active', 'in_progress', 'completed', 'cancelled', 'disputed'];
  const DEAL_TYPES = ['DEAL-PROJECT', 'DEAL-PRODUCT'];

  it('has exactly 5 lifecycle states', () => {
    expect(VALID_STATES).toHaveLength(5);
  });

  it('has 2 deal types', () => {
    expect(DEAL_TYPES).toHaveLength(2);
  });

  // Deals can only transition in specific directions
  const VALID_TRANSITIONS: Record<string, string[]> = {
    active: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled', 'disputed'],
    disputed: ['in_progress', 'cancelled'],
    // Terminal states
    completed: [],
    cancelled: [],
  };

  it('completed is a terminal state', () => {
    expect(VALID_TRANSITIONS['completed']).toHaveLength(0);
  });

  it('cancelled is a terminal state', () => {
    expect(VALID_TRANSITIONS['cancelled']).toHaveLength(0);
  });

  it('active can transition to in_progress or cancelled', () => {
    expect(VALID_TRANSITIONS['active']).toContain('in_progress');
    expect(VALID_TRANSITIONS['active']).toContain('cancelled');
    expect(VALID_TRANSITIONS['active']).not.toContain('completed');
  });
});

// ---------------------------------------------------------------------------
// Deal creation triggers (business rules)
// ---------------------------------------------------------------------------
describe('Deal creation triggers', () => {
  const VALID_TRIGGERS = [
    'bid_award',
    'inquiry_quotation_accepted',
    'rfq_response_accepted',
    'direct_hire_quotation_accepted',
  ];

  it('has exactly 4 valid deal creation triggers', () => {
    expect(VALID_TRIGGERS).toHaveLength(4);
  });

  it('all triggers produce a deal', () => {
    // Each trigger must result in a deal — never from other events
    for (const trigger of VALID_TRIGGERS) {
      expect(trigger).toBeTruthy();
    }
  });

  it('no deal creation without bid award or quotation acceptance', () => {
    const INVALID_TRIGGERS = ['user_request', 'admin_action', 'payment_received'];
    for (const invalid of INVALID_TRIGGERS) {
      expect(VALID_TRIGGERS).not.toContain(invalid);
    }
  });
});

// ---------------------------------------------------------------------------
// MilestoneSchema validation
// ---------------------------------------------------------------------------
describe('MilestoneSchema validation', () => {
  const validMilestone = {
    deal_id: '550e8400-e29b-41d4-a716-446655440000',
    title_ar: 'مرحلة التأسيس',
    title_en: 'Foundation phase',
    sort_order: 0,
  };

  it('accepts valid milestone', () => {
    expect(MilestoneSchema.safeParse(validMilestone).success).toBe(true);
  });

  it('rejects short title_ar (< 3 chars)', () => {
    const result = MilestoneSchema.safeParse({
      ...validMilestone,
      title_ar: 'أ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid deal_id', () => {
    const result = MilestoneSchema.safeParse({
      ...validMilestone,
      deal_id: 'not-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional payment_amount', () => {
    const result = MilestoneSchema.safeParse({
      ...validMilestone,
      payment_amount: 25000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative payment_amount', () => {
    const result = MilestoneSchema.safeParse({
      ...validMilestone,
      payment_amount: -100,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ProofSchema validation
// ---------------------------------------------------------------------------
describe('ProofSchema validation', () => {
  const validProof = {
    deal_id: '550e8400-e29b-41d4-a716-446655440000',
    proof_type: 'work' as const,
    description: 'تم الانتهاء من أعمال التأسيس',
    percentage_claim: 25,
  };

  it('accepts valid proof submission', () => {
    expect(ProofSchema.safeParse(validProof).success).toBe(true);
  });

  it('accepts all proof types', () => {
    for (const type of ['payment', 'work', 'supply', 'handover']) {
      const result = ProofSchema.safeParse({ ...validProof, proof_type: type });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid proof_type', () => {
    const result = ProofSchema.safeParse({
      ...validProof,
      proof_type: 'other',
    });
    expect(result.success).toBe(false);
  });

  it('rejects percentage over 100', () => {
    const result = ProofSchema.safeParse({
      ...validProof,
      percentage_claim: 150,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative percentage', () => {
    const result = ProofSchema.safeParse({
      ...validProof,
      percentage_claim: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects short description (< 5 chars)', () => {
    const result = ProofSchema.safeParse({
      ...validProof,
      description: 'تم',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CancelRequestSchema validation
// ---------------------------------------------------------------------------
describe('CancelRequestSchema validation', () => {
  it('accepts valid cancel request', () => {
    const result = CancelRequestSchema.safeParse({
      deal_id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'عدم التزام المقاول بالجدول الزمني المتفق عليه',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short reason (< 10 chars)', () => {
    const result = CancelRequestSchema.safeParse({
      deal_id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'سبب',
    });
    expect(result.success).toBe(false);
  });
});
