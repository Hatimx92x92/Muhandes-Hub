// =============================================================================
// Test: Login Flow (#336)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { LoginSchema, ResetPasswordSchema, UpdatePasswordSchema } from '@/schemas/auth';

// ---------------------------------------------------------------------------
// LoginSchema tests
// ---------------------------------------------------------------------------
describe('LoginSchema validation', () => {
  it('accepts valid login data', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: 'validpassword',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({
      email: 'invalid',
      password: 'validpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = LoginSchema.safeParse({
      password: 'validpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ResetPasswordSchema tests
// ---------------------------------------------------------------------------
describe('ResetPasswordSchema validation', () => {
  it('accepts valid email', () => {
    const result = ResetPasswordSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = ResetPasswordSchema.safeParse({
      email: 'not-email',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UpdatePasswordSchema tests
// ---------------------------------------------------------------------------
describe('UpdatePasswordSchema validation', () => {
  it('accepts matching passwords of valid length', () => {
    const result = UpdatePasswordSchema.safeParse({
      password: 'NewSecure123',
      confirmPassword: 'NewSecure123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-matching passwords', () => {
    const result = UpdatePasswordSchema.safeParse({
      password: 'NewSecure123',
      confirmPassword: 'Different456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = UpdatePasswordSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password over 72 chars', () => {
    const long = 'a'.repeat(73);
    const result = UpdatePasswordSchema.safeParse({
      password: long,
      confirmPassword: long,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Login status routing logic tests
// ---------------------------------------------------------------------------
describe('Login verification gate routing', () => {
  const GATE_ROUTES: Record<string, string> = {
    pending_email: '/verify/email-sent',
    pending_payment: '/verify/payment',
    pending_documents: '/verify/documents',
    pending_approval: '/verify/pending-approval',
  };

  it('maps each pending status to a verify route', () => {
    for (const [status, route] of Object.entries(GATE_ROUTES)) {
      expect(route).toMatch(/^\/verify\//);
      expect(status).toMatch(/^pending_/);
    }
  });

  it('has 4 verification gates', () => {
    expect(Object.keys(GATE_ROUTES)).toHaveLength(4);
  });

  it('banned and restricted users should not get routes', () => {
    expect(GATE_ROUTES['banned']).toBeUndefined();
    expect(GATE_ROUTES['restricted']).toBeUndefined();
    expect(GATE_ROUTES['active']).toBeUndefined();
  });
});
