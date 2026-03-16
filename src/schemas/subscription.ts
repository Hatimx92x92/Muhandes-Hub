import { z } from 'zod/v4';
import { SubscriptionTier } from '@/types/enums';

// =============================================================================
// Subscription schemas
// =============================================================================

const tierValues = Object.values(SubscriptionTier) as [string, ...string[]];

export const SubscribeSchema = z.object({
  tier: z.enum(tierValues),
  duration_months: z.enum(['1', '3', '6', '12']),
  coupon_code: z.string().optional(),
});

export type SubscribeData = z.infer<typeof SubscribeSchema>;

export const ApplyCouponSchema = z.object({
  coupon_code: z.string().min(3, 'Coupon code is required'),
  tier: z.enum(tierValues),
});

export type ApplyCouponData = z.infer<typeof ApplyCouponSchema>;

export const UpgradeSubscriptionSchema = z.object({
  new_tier: z.enum(tierValues),
});

export type UpgradeSubscriptionData = z.infer<typeof UpgradeSubscriptionSchema>;
