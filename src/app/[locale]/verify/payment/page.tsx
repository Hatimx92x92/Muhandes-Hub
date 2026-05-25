import { CreditCard, Clock, CheckCircle, Building2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatSAR } from '@/lib/utils';

// =============================================================================
// Gate 2: Payment Pending — subscription details + payment instructions
// =============================================================================

const TIER_PRICES: Record<string, number> = {
  pro: 200,
  business: 500,
  enterprise: 800,
};

export default async function PaymentPage() {
  const t = await getTranslations('verify.payment');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: profile } = await db
    .from('profiles')
    .select('verification_status, bank_receipt_url')
    .eq('id', user.id)
    .single();

  // If not in pending_payment gate, redirect appropriately
  if (profile?.verification_status !== 'pending_payment') {
    // Use saved redirect cookie if available
    const cookieStore = await cookies();
    const savedRedirect = cookieStore.get('mh_verify_redirect')?.value;

    if (profile?.verification_status === 'active') redirect(savedRedirect || '/dashboard');
    if (profile?.verification_status === 'pending_documents') redirect('/verify/documents');
    if (profile?.verification_status === 'pending_approval') redirect('/verify/pending-approval');
    redirect(savedRedirect || '/dashboard');
  }

  // Fetch subscription details
  const { data: sub } = await db
    .from('subscriptions')
    .select('tier, duration_months')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const tier = (sub?.tier as string) || 'pro';
  const durationMonths = (sub?.duration_months as number) || 1;
  const basePrice = TIER_PRICES[tier] || 200;
  const totalPrice = basePrice * durationMonths;

  const hasBankReceipt = !!profile?.bank_receipt_url;

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {hasBankReceipt ? (
            <Clock className="h-8 w-8 text-primary" />
          ) : (
            <CreditCard className="h-8 w-8 text-primary" />
          )}
        </div>
        <CardTitle className="text-xl">
          {hasBankReceipt ? t('bankPending') : t('title')}
        </CardTitle>
        <CardDescription>
          {hasBankReceipt ? t('bankPendingDesc') : t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tierLabel')}</span>
            <span className="font-semibold text-foreground capitalize">{t(`tiers.${tier}` as never)}</span>
          </div>
          {durationMonths > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('duration')}</span>
              <span className="font-medium text-foreground">
                {durationMonths} {t('months')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
            <span className="text-muted-foreground">{t('totalAmount')}</span>
            <span className="text-lg font-bold text-primary">{formatSAR(totalPrice)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">{t('vatInclusive')}</p>
        </div>

        {hasBankReceipt && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {t('bankReceiptUploaded')}
          </div>
        )}

        {/* Bank transfer instructions */}
        {!hasBankReceipt && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t('bankTransfer')}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('bankName')}</span>
                  <span className="font-medium text-foreground" dir="ltr">Al Rajhi Bank</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('iban')}</span>
                  <span className="font-mono text-xs text-foreground" dir="ltr">SA44 8000 0XXX XXXX XXXX XXXX</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('reference')}</span>
                  <span className="font-mono text-xs text-foreground" dir="ltr">{user.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t('onlinePayment')}
            </p>

            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full">
                {t('contactSupport')}
              </Button>
            </Link>
          </div>
        )}

        <div className="flex gap-3">
          <form action="/api/auth/signout" method="post" className="flex-1">
            <Button variant="ghost" className="w-full" type="submit">
              {t('logout')}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
