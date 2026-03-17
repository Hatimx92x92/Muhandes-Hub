// =============================================================================
// Subscription Management Page
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import {
  SUBSCRIPTION_PRICING,
  TIER_LIMITS,
  VAT_RATE,
  type SubscriptionTier,
} from '@/types';
import { Check, X, Crown, ArrowUpLeft } from 'lucide-react';

// ---------------------------------------------------------------------------
// Tier details
// ---------------------------------------------------------------------------

const tierColors: Record<string, string> = {
  starter: 'text-muted-foreground',
  pro: 'text-tier-pro',
  business: 'text-tier-business',
  enterprise: 'text-tier-enterprise',
};

const TIER_NAMES_EN: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
};

const allTiers: SubscriptionTier[] = ['starter', 'pro', 'business', 'enterprise'];

function formatPrice(amount: number, locale: string, sarText: string, freeText: string): string {
  if (amount === 0) return freeText;
  return `${amount.toLocaleString(locale)} ${sarText}`;
}

function formatDate(dateStr: string | null, locale: string, fallback: string): string {
  if (!dateStr) return fallback;
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function LimitRow({ label, value, unlimitedText }: { label: string; value: string | number | boolean; unlimitedText?: string }) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between py-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        {value ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">
        {value === Infinity ? (unlimitedText ?? 'Unlimited') : value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (f: string, v: string) => {
          single: () => Promise<{
            data: {
              role: string;
            } | null;
          }>;
          eq: (f2: string, v2: boolean) => {
            single: () => Promise<{
              data: {
                tier: string;
                expires_at: string | null;
              } | null;
            }>;
          };
        };
      };
    };
  };

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: sub } = await db
    .from('subscriptions')
    .select('tier, expires_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const currentTier = (sub?.tier as SubscriptionTier) || 'starter';
  const expiresAt = sub?.expires_at || null;
  const color = tierColors[currentTier] || tierColors.starter;
  const limits = TIER_LIMITS[currentTier] || TIER_LIMITS.starter;

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  const t = await getTranslations('dashboard.subscription');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();
  const sarText = tCommon('sar');
  const freeText = tCommon('free');
  const unlimitedText = tCommon('unlimited');

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t('subtitle')}
      </p>

      {/* Current plan card */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className={`h-5 w-5 ${color}`} />
              <h2 className="text-xl font-bold text-foreground">{t(`tiers.${currentTier}` as never)}</h2>
              {locale === 'ar' && (
                <span className="text-sm text-muted-foreground">({TIER_NAMES_EN[currentTier]})</span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">
              {formatPrice(
                SUBSCRIPTION_PRICING[currentTier as keyof typeof SUBSCRIPTION_PRICING]?.monthly *
                  (1 + VAT_RATE),
                locale,
                sarText,
                freeText,
              )}
              {currentTier !== 'starter' && (
                <span className="text-sm text-muted-foreground font-normal">{t('perMonth')}</span>
              )}
            </p>
          </div>

          {isExpired && (
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
              {t('expired')}
            </span>
          )}

          {!isExpired && currentTier !== 'starter' && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {t('active')}
            </span>
          )}
        </div>

        {expiresAt && (
          <p className="mt-3 text-sm text-muted-foreground">
            {isExpired ? t('expiredOn') : t('expiresOn')}: {formatDate(expiresAt, locale, t('unspecified'))}
          </p>
        )}

        {/* Current limits */}
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('currentLimits')}</h3>
          <div className="divide-y divide-border/50">
            <LimitRow label={t('limits.bidsPerMonth')} value={limits.bidsPerMonth} unlimitedText={unlimitedText} />
            <LimitRow label={t('limits.products')} value={limits.productPosts} unlimitedText={unlimitedText} />
            <LimitRow label={t('limits.crmClients')} value={limits.crmClients} unlimitedText={unlimitedText} />
            <LimitRow label={t('limits.quotationsPerMonth')} value={limits.quotationsPerMonth} unlimitedText={unlimitedText} />
            <LimitRow label={t('limits.contractsPerMonth')} value={limits.contractsPerMonth} unlimitedText={unlimitedText} />
            <LimitRow label={t('limits.commission')} value={`${(limits.commissionRate * 100).toFixed(0)}%`} />
            <LimitRow label={t('limits.kanban')} value={limits.hasKanban === false ? false : true} />
            <LimitRow label={t('limits.analytics')} value={limits.hasAnalytics === false ? false : true} />
            <LimitRow label={t('limits.csvUpload')} value={limits.hasBulkUpload} />
          </div>
        </div>
      </div>

      {/* Upgrade options */}
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('changePlan')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {allTiers.map((tierId) => {
          const tMeta = tierColors[tierId];
          const price = SUBSCRIPTION_PRICING[tierId as keyof typeof SUBSCRIPTION_PRICING]?.monthly ?? 0;
          const isCurrent = tierId === currentTier;

          return (
            <div
              key={tierId}
              className={`rounded-xl border p-5 ${
                isCurrent
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'border-border bg-card'
              }`}
            >
              <h3 className={`font-semibold ${tMeta}`}>{t(`tiers.${tierId}` as never)}</h3>
              {locale === 'ar' && (
                <p className="text-xs text-muted-foreground">{TIER_NAMES_EN[tierId]}</p>
              )}
              <p className="mt-2 text-xl font-bold text-foreground">
                {price === 0 ? freeText : formatPrice(price * (1 + VAT_RATE), locale, sarText, freeText)}
              </p>
              {price > 0 && (
                <p className="text-xs text-muted-foreground">{t('monthlyVatInclusive')}</p>
              )}

              {isCurrent ? (
                <div className="mt-4 text-center text-sm font-medium text-primary">
                  {t('currentPlanBadge')}
                </div>
              ) : (
                <Link
                  href={`/dashboard/subscription/change?tier=${tierId}`}
                  className={`mt-4 inline-flex w-full h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    allTiers.indexOf(tierId) > allTiers.indexOf(currentTier)
                      ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
                      : 'border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {allTiers.indexOf(tierId) > allTiers.indexOf(currentTier)
                    ? t('upgrade')
                    : t('downgrade')}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
