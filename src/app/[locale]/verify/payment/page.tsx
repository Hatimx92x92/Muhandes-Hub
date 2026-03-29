import { CreditCard, Clock, CheckCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Gate 2: Payment Pending — card or bank transfer status
// =============================================================================

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
    if (profile?.verification_status === 'active') redirect('/dashboard');
    if (profile?.verification_status === 'pending_documents') redirect('/verify/documents');
    if (profile?.verification_status === 'pending_approval') redirect('/verify/pending-approval');
    redirect('/dashboard');
  }

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
        {hasBankReceipt && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {t('bankReceiptUploaded')}
          </div>
        )}

        {!hasBankReceipt && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            {t('placeholder')}
            <br />
            <Link href="/contact" className="text-primary hover:underline">
              {t('contactLink')}
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
