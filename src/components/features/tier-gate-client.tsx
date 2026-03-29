// =============================================================================
// TierGateClient — Client-side tier gating using useSubscription hook
// =============================================================================
// Use in client components where subscription state is available via hook.
// For server components, use <TierGate> directly with server-side tier checks.

'use client';

import type { ReactNode } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@/hooks/use-auth';
import { TierGate, TierLimitIndicator } from './tier-gate';

// ---------------------------------------------------------------------------
// Feature gate — boolean features like hasKanban, hasAnalytics, etc.
// ---------------------------------------------------------------------------

type FeatureKey = 'hasKanban' | 'hasAnalytics' | 'hasBulkUpload' | 'hasClauseLibrary' | 'hasCustomContracts';

interface FeatureGateProps {
  profile: UserProfile | null;
  feature: FeatureKey;
  children: ReactNode;
}

export function FeatureGate({ profile, feature, children }: FeatureGateProps) {
  const { hasFeature } = useSubscription(profile);
  const t = useTranslations('tierGate');

  const isLocked = !hasFeature(feature);

  return (
    <TierGate
      isLocked={isLocked}
      title={t(`${feature}.title`)}
      description={t(`${feature}.description`)}
      upgradeLabel={t('upgrade')}
      variant="feature"
      mode="page"
    >
      {children}
    </TierGate>
  );
}

// ---------------------------------------------------------------------------
// Limit gate — numeric limits like bidsPerMonth, productPosts, etc.
// ---------------------------------------------------------------------------

type LimitKey = 'bidsPerMonth' | 'productPosts' | 'crmClients' | 'quotationsPerMonth' | 'contractsPerMonth';

interface LimitGateProps {
  profile: UserProfile | null;
  limitKey: LimitKey;
  currentCount: number;
  children: ReactNode;
}

export function LimitGate({ profile, limitKey, currentCount, children }: LimitGateProps) {
  const { canCreate, tier } = useSubscription(profile);
  const t = useTranslations('tierGate');

  const isLocked = !canCreate(limitKey, currentCount);

  return (
    <TierGate
      isLocked={isLocked}
      title={t(`${limitKey}.title`)}
      description={t(`${limitKey}.description`, { tier, count: currentCount })}
      upgradeLabel={t('upgrade')}
      variant="limit"
      mode="inline"
    >
      {children}
    </TierGate>
  );
}

// ---------------------------------------------------------------------------
// Re-export TierLimitIndicator for convenience
// ---------------------------------------------------------------------------
export { TierLimitIndicator };
