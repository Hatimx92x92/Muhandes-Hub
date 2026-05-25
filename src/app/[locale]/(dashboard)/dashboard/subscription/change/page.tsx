// =============================================================================
// Subscription Change Page — Upgrade / Downgrade / Renew
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import {
  SUBSCRIPTION_PRICING,
  TIER_LIMITS,
  VAT_RATE,
} from '@/types';
import type { SubscriptionTier } from '@/types/enums';
import {
  SubscriptionChangeForm,
  type ChangeMode,
} from '@/components/features/subscription-change-form';

// ---------------------------------------------------------------------------
// Tier ordering
// ---------------------------------------------------------------------------
const TIER_ORDER = { starter: 0, pro: 1, business: 2, enterprise: 3 } as const;
const allTiers: SubscriptionTier[] = ['starter', 'pro', 'business', 'enterprise'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SubscriptionChangePage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tier?: string; mode?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.subscription.change');
  const tSub = await getTranslations('dashboard.subscription');
  const tp = await getTranslations('pricing');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch profile
  const { data: profile } = await db
    .from('profiles')
    .select('subscription_tier, role')
    .eq('id', user.id)
    .single();

  // Fetch active subscription
  const { data: activeSub } = await db
    .from('subscriptions')
    .select('id, tier, starts_at, expires_at, final_price, duration_months, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const userRole = (profile?.role as string) || 'contractor';
  const currentTier = (activeSub?.tier as string) || (profile?.subscription_tier as string) || 'starter';
  const currentTierIndex = TIER_ORDER[currentTier as keyof typeof TIER_ORDER] ?? 0;

  // Determine target tier, defaulting from query params
  const targetTier = params.tier && allTiers.includes(params.tier as SubscriptionTier)
    ? params.tier
    : null;

  if (!targetTier) {
    redirect('/dashboard/subscription');
  }

  const targetTierIndex = TIER_ORDER[targetTier as keyof typeof TIER_ORDER] ?? 0;

  // Determine mode
  let mode: ChangeMode;
  if (params.mode === 'renew') {
    mode = 'renew';
  } else if (targetTierIndex > currentTierIndex) {
    mode = 'upgrade';
  } else if (targetTierIndex < currentTierIndex) {
    mode = 'downgrade';
  } else {
    // Same tier = renew
    mode = 'renew';
  }

  // Prevent invalid operations
  if (mode === 'downgrade' && targetTier === 'starter' && currentTier === 'starter') {
    redirect('/dashboard/subscription');
  }

  const targetPrice = SUBSCRIPTION_PRICING[targetTier as keyof typeof SUBSCRIPTION_PRICING]?.monthly ?? 0;
  const targetLimits = TIER_LIMITS[targetTier] || TIER_LIMITS.starter;
  const currentLimits = TIER_LIMITS[currentTier] || TIER_LIMITS.starter;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <Link
        href="/dashboard/subscription"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        {t('backToSubscription')}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('subtitle')}</p>

      {/* Plan comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Current plan */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{t('currentPlan')}</p>
          <h3 className="text-lg font-bold text-foreground">{tp(`tiers.${currentTier}.name`)}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {SUBSCRIPTION_PRICING[currentTier as keyof typeof SUBSCRIPTION_PRICING]?.monthly === 0
              ? tSub('tiers.starter')
              : `${formatPrice(SUBSCRIPTION_PRICING[currentTier as keyof typeof SUBSCRIPTION_PRICING]?.monthly * (1 + VAT_RATE), locale)} ${t('perMonth')}`}
          </p>
          {activeSub?.expires_at && (
            <p className="text-xs text-muted-foreground mt-2">
              {tSub('expiresOn')}: {new Date(activeSub.expires_at as string).toLocaleDateString(
                locale === 'ar' ? 'ar-SA' : 'en-SA',
              )}
            </p>
          )}
        </div>

        {/* Target plan */}
        <div className={`rounded-xl border-2 p-4 ${
          mode === 'upgrade' ? 'border-primary bg-primary/5' :
            mode === 'downgrade' ? 'border-accent-orange-foreground/30 bg-accent-orange' :
              'border-info/30 bg-info/10'
        }`}>
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
            {mode === 'upgrade' ? t('newPlan') : mode === 'downgrade' ? t('downgradeTo') : t('renewPlan')}
          </p>
          <h3 className="text-lg font-bold text-foreground">{tp(`tiers.${targetTier}.name`)}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {targetPrice === 0
              ? tSub('tiers.starter')
              : `${formatPrice(targetPrice * (1 + VAT_RATE), locale)} ${t('perMonth')}`}
          </p>
        </div>
      </div>

      {/* Key differences for upgrade/downgrade — filtered by role */}
      {mode !== 'renew' && (
        <div className="rounded-lg border border-border bg-card p-4 mb-8">
          <h4 className="text-sm font-semibold text-foreground mb-3">{t('keyChanges')}</h4>
          <div className="space-y-2 text-sm">
            {/* Contractor-specific */}
            {userRole === 'contractor' && (
              <ChangeRow
                label={tSub('limits.bidsPerMonth')}
                from={currentLimits.bidsPerMonth}
                to={targetLimits.bidsPerMonth}
                isUpgrade={mode === 'upgrade'}
              />
            )}
            {/* Supplier-specific */}
            {userRole === 'supplier' && (
              <ChangeRow
                label={tSub('limits.products')}
                from={currentLimits.productPosts}
                to={targetLimits.productPosts}
                isUpgrade={mode === 'upgrade'}
              />
            )}
            {/* Shared */}
            <ChangeRow
              label={tSub('limits.crmClients')}
              from={currentLimits.crmClients}
              to={targetLimits.crmClients}
              isUpgrade={mode === 'upgrade'}
            />
            <ChangeRow
              label={tSub('limits.quotationsPerMonth')}
              from={currentLimits.quotationsPerMonth}
              to={targetLimits.quotationsPerMonth}
              isUpgrade={mode === 'upgrade'}
            />
            <ChangeRow
              label={tSub('limits.commission')}
              from={`${(currentLimits.commissionRate * 100).toFixed(0)}%`}
              to={`${(targetLimits.commissionRate * 100).toFixed(0)}%`}
              isUpgrade={mode === 'upgrade'}
            />
          </div>
        </div>
      )}

      {/* Change form */}
      <SubscriptionChangeForm
        mode={mode}
        currentTier={currentTier}
        targetTier={targetTier}
        currentExpiresAt={(activeSub?.expires_at as string) || null}
        currentStartsAt={(activeSub?.starts_at as string) || null}
        currentSubTotal={(activeSub?.final_price as number) || 0}
        currentDurationMonths={(activeSub?.duration_months as number) || 1}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + (locale === 'ar' ? ' ر.س' : ' SAR');
}

function ChangeRow({
  label,
  from,
  to,
  isUpgrade,
}: {
  label: string;
  from: number | string;
  to: number | string;
  isUpgrade: boolean;
}) {
  const fromDisplay = from === Infinity ? '∞' : String(from);
  const toDisplay = to === Infinity ? '∞' : String(to);
  if (fromDisplay === toDisplay) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground line-through">{fromDisplay}</span>
        <span className="text-foreground">→</span>
        <span className={isUpgrade ? 'text-primary font-medium' : 'text-accent-orange-foreground font-medium'}>
          {toDisplay}
        </span>
      </span>
    </div>
  );
}
