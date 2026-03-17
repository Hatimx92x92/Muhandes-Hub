import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SubscriptionManagerButton } from '@/components/features/admin/subscription-manager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const tierFilter = params.tier ?? 'all';

  let query = db(supabase)
    .from('subscriptions')
    .select('id, user_id, tier, is_active, payment_status, starts_at, expires_at, final_price, created_at, profiles:user_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (tierFilter !== 'all') {
    query = query.eq('tier', tierFilter);
  }

  const { data: subscriptions } = await query;

  // Stats: count by tier
  const [
    { count: starterCount },
    { count: proCount },
    { count: businessCount },
    { count: enterpriseCount },
  ] = await Promise.all([
    db(supabase).from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'starter').eq('is_active', true),
    db(supabase).from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'pro').eq('is_active', true),
    db(supabase).from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'business').eq('is_active', true),
    db(supabase).from('subscriptions').select('*', { count: 'exact', head: true }).eq('tier', 'enterprise').eq('is_active', true),
  ]);

  const tiers = ['all', 'starter', 'pro', 'business', 'enterprise'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('subscriptionsPage.title')}</h1>
        <p className="text-muted-foreground">{t('subscriptionsPage.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.starter')}</p>
            <p className="text-2xl font-bold">{starterCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.pro')}</p>
            <p className="text-2xl font-bold text-blue-600">{proCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.business')}</p>
            <p className="text-2xl font-bold text-indigo-600">{businessCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.enterprise')}</p>
            <p className="text-2xl font-bold text-amber-600">{enterpriseCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier filter */}
      <div className="flex flex-wrap gap-2">
        {tiers.map((tp) => (
          <a
            key={tp}
            href={`/admin/subscriptions?tier=${tp}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tierFilter === tp
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tp === 'all' ? t('all') : t(`subscriptionTier.${tp}`)}
          </a>
        ))}
      </div>

      {/* Subscriptions list */}
      {!subscriptions || subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('subscriptionsPage.noSubscriptions')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(subscriptions as Record<string, unknown>[]).map((sub) => (
            <Card key={sub.id as string}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    {t('subscriptionsPage.subscriptionPrefix')} #{(sub.id as string).slice(0, 8)}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={(sub.tier as string) as 'starter' | 'pro' | 'business' | 'enterprise'}>
                      {t(`subscriptionTier.${sub.tier as string}`)}
                    </Badge>
                    <Badge variant={sub.is_active ? 'active' : 'warning'}>
                      {sub.is_active ? t('subscriptionStatus.active') : t('subscriptionStatus.expired')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    {(() => {
                      const profiles = (sub as Record<string, unknown>).profiles as Record<string, string> | null;
                      const name = profiles?.full_name ?? null;
                      if (!name) return null;
                      return (
                        <p>
                          <Link
                            href={`/admin/users/${sub.user_id as string}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {name}
                          </Link>
                        </p>
                      );
                    })()}
                    <p>
                      <span className="text-muted-foreground">{t('subscriptionsPage.amountLabel')} </span>
                      <span className="font-semibold">{Number(sub.final_price ?? 0).toLocaleString(locale)} {t('sar')}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.starts_at ? new Date(sub.starts_at as string).toLocaleDateString(locale) : '—'}
                      {' ← '}
                      {sub.expires_at ? new Date(sub.expires_at as string).toLocaleDateString(locale) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SubscriptionManagerButton
                      userId={sub.user_id as string}
                      currentTier={sub.tier as string}
                      currentStatus={sub.is_active ? 'active' : 'expired'}
                      subscriptionId={sub.id as string}
                    />
                    <time className="text-xs text-muted-foreground">
                      {new Date(sub.created_at as string).toLocaleDateString(locale)}
                    </time>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
