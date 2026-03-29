// =============================================================================
// Muhandes HUB — Type Re-exports & Derived Application Types
// =============================================================================

export type { Database, Json } from './database';
export * from './enums';

// ---------------------------------------------------------------------------
// Server Action Result — standard return type for all server actions
// ---------------------------------------------------------------------------
export type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string; fieldErrors?: Record<string, string[]> };

// ---------------------------------------------------------------------------
// Locale
// ---------------------------------------------------------------------------
export type Locale = 'ar' | 'en';

// ---------------------------------------------------------------------------
// Bilingual field helpers
// ---------------------------------------------------------------------------
export interface BilingualText {
  ar: string;
  en: string;
}

// ---------------------------------------------------------------------------
// Subscription tier limits
// ---------------------------------------------------------------------------
export interface TierLimits {
  bidsPerMonth: number;       // Contractor: 10 | 50 | 100 | Infinity
  productPosts: number;       // Supplier: 2 | 10 | 50 | Infinity
  crmClients: number;         // 20 | 200 | Infinity
  quotationsPerMonth: number; // 3 | 20 | Infinity
  contractsPerMonth: number;  // Infinity (2 basic) | 10 | Infinity
  commissionRate: number;     // 0.02 | 0.01 | 0 | 0
  hasKanban: boolean | 'checklist' | 'full';
  hasAnalytics: boolean | 'basic' | 'summary' | 'full';
  hasBulkUpload: boolean;
  hasClauseLibrary: boolean;
  hasCustomContracts: boolean;
}

/** Map tier → limits */
export const TIER_LIMITS: Record<string, TierLimits> = {
  starter: {
    bidsPerMonth: 10,
    productPosts: 2,
    crmClients: 20,
    quotationsPerMonth: 3,
    contractsPerMonth: Infinity, // 2 basic templates only
    commissionRate: 0.02,
    hasKanban: false,
    hasAnalytics: false,
    hasBulkUpload: false,
    hasClauseLibrary: false,
    hasCustomContracts: false,
  },
  pro: {
    bidsPerMonth: 50,
    productPosts: 10,
    crmClients: 200,
    quotationsPerMonth: 20,
    contractsPerMonth: 10,
    commissionRate: 0.01,
    hasKanban: 'checklist',
    hasAnalytics: 'summary',
    hasBulkUpload: false,
    hasClauseLibrary: true,
    hasCustomContracts: false,
  },
  business: {
    bidsPerMonth: 100,
    productPosts: 50,
    crmClients: Infinity,
    quotationsPerMonth: Infinity,
    contractsPerMonth: Infinity,
    commissionRate: 0,
    hasKanban: 'full',
    hasAnalytics: 'full',
    hasBulkUpload: true,
    hasClauseLibrary: true,
    hasCustomContracts: true,
  },
  enterprise: {
    bidsPerMonth: Infinity,
    productPosts: Infinity,
    crmClients: Infinity,
    quotationsPerMonth: Infinity,
    contractsPerMonth: Infinity,
    commissionRate: 0,
    hasKanban: 'full',
    hasAnalytics: 'full',
    hasBulkUpload: true,
    hasClauseLibrary: true,
    hasCustomContracts: true,
  },
};

// ---------------------------------------------------------------------------
// Subscription pricing
// ---------------------------------------------------------------------------
export const SUBSCRIPTION_PRICING = {
  starter: { monthly: 0 },
  pro: { monthly: 200 },
  business: { monthly: 500 },
  enterprise: { monthly: 800 },
} as const;

/** Duration discount percentages */
export const DURATION_DISCOUNTS = {
  1: 0,
  3: 0.05,
  6: 0.15,
  12: 0.35,
} as const;

/** Saudi VAT rate */
export const VAT_RATE = 0.15;
