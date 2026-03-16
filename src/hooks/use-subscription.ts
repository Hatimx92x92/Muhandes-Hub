'use client';

import { useMemo } from 'react';
import { TIER_LIMITS, type TierLimits, type SubscriptionTier } from '@/types';
import type { UserProfile } from './use-auth';

// =============================================================================
// useSubscription hook — tier limits, feature checks, quota helpers
// =============================================================================

export function useSubscription(profile: UserProfile | null) {
  const tier: SubscriptionTier = profile?.subscription_tier ?? 'starter';

  const limits: TierLimits = useMemo(() => TIER_LIMITS[tier] ?? TIER_LIMITS.starter, [tier]);

  const isExpired = useMemo(() => {
    if (!profile?.subscription_expires_at) return false;
    return new Date(profile.subscription_expires_at) < new Date();
  }, [profile?.subscription_expires_at]);

  /** Effective tier (falls back to starter if expired) */
  const effectiveTier: SubscriptionTier = isExpired ? 'starter' : tier;
  const effectiveLimits: TierLimits = isExpired ? TIER_LIMITS.starter : limits;

  /** Check if a numeric limit allows creation (current < max) */
  const canCreate = (
    limitKey: 'bidsPerMonth' | 'productPosts' | 'crmClients' | 'quotationsPerMonth' | 'contractsPerMonth',
    currentCount: number,
  ): boolean => {
    const max = effectiveLimits[limitKey];
    if (max === Infinity) return true;
    return currentCount < max;
  };

  /** Check if a feature is available */
  const hasFeature = (
    featureKey: 'hasKanban' | 'hasAnalytics' | 'hasBulkUpload' | 'hasClauseLibrary' | 'hasCustomContracts',
  ): boolean => {
    const val = effectiveLimits[featureKey];
    return val === true || val === 'checklist' || val === 'full' || val === 'summary';
  };

  /** Get remaining quota for a limit */
  const remaining = (
    limitKey: 'bidsPerMonth' | 'productPosts' | 'crmClients' | 'quotationsPerMonth' | 'contractsPerMonth',
    currentCount: number,
  ): number => {
    const max = effectiveLimits[limitKey];
    if (max === Infinity) return Infinity;
    return Math.max(0, max - currentCount);
  };

  return {
    tier: effectiveTier,
    limits: effectiveLimits,
    isExpired,
    canCreate,
    hasFeature,
    remaining,
    commissionRate: effectiveLimits.commissionRate,
  };
}
