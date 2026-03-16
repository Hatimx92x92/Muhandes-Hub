// =============================================================================
// Test: Registration Flow (#335)
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterSchema } from '@/schemas/auth';

// ---------------------------------------------------------------------------
// Schema-level validation tests (no server action mocking needed)
// ---------------------------------------------------------------------------
describe('RegisterSchema validation', () => {
  const validBase = {
    role: 'contractor' as const,
    full_name: 'أحمد محمد',
    email: 'ahmed@example.com',
    password: 'SecureP@ss123',
    phone: '501234567',
    pdpl_consent: true as const,
    profile_type: 'company' as const,
    company_name_ar: 'شركة أحمد',
    company_name_en: 'Ahmed Co',
    cr_number: '1234567890',
    city: 'الرياض',
    tier: 'starter' as const,
  };

  it('accepts valid contractor registration', () => {
    const result = RegisterSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts valid project_owner without tier', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      role: 'project_owner',
      tier: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid buyer without tier', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      role: 'buyer',
      tier: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password (< 8 chars)', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone number', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      phone: '123', // must be 9 digits
    });
    expect(result.success).toBe(false);
  });

  it('rejects non +966 format phone (10 digits)', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      phone: '0501234567', // 10 digits, should be 9
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing pdpl_consent', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      pdpl_consent: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty city', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      city: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid tier value', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      tier: 'premium',
    });
    expect(result.success).toBe(false);
  });

  it('accepts personal profile without company fields', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      profile_type: 'personal',
      company_name_ar: undefined,
      company_name_en: undefined,
      cr_number: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all four valid roles', () => {
    for (const role of ['project_owner', 'contractor', 'supplier', 'buyer']) {
      const result = RegisterSchema.safeParse({ ...validBase, role });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid tiers', () => {
    for (const tier of ['starter', 'pro', 'business', 'enterprise']) {
      const result = RegisterSchema.safeParse({ ...validBase, tier });
      expect(result.success).toBe(true);
    }
  });

  it('rejects password over 72 chars', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      password: 'a'.repeat(73),
    });
    expect(result.success).toBe(false);
  });

  it('rejects full_name over 100 chars', () => {
    const result = RegisterSchema.safeParse({
      ...validBase,
      full_name: 'أ'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});
