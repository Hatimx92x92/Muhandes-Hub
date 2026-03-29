// =============================================================================
// Payments Page — unified view of all subscription + commission payments
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { CreditCard, Receipt, Banknote, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatSAR } from '@/lib/utils';
import { getInvoices } from '@/actions/subscriptions';
import { PaymentsTable } from '@/components/features/payments-table';

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.payments');
  const locale = await getLocale();

  const { data: invoices } = await getInvoices();
  const items = invoices ?? [];

  // Compute stats
  const totalPaid = items.reduce((sum, inv) => sum + inv.total, 0);
  const subscriptionTotal = items
    .filter((inv) => inv.type === 'subscription')
    .reduce((sum, inv) => sum + inv.total, 0);
  const commissionTotal = items
    .filter((inv) => inv.type === 'commission')
    .reduce((sum, inv) => sum + inv.total, 0);
  const invoiceCount = items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('totalPaid')}</p>
              <p className="text-xl font-extrabold">{formatSAR(totalPaid, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tier-pro/10">
              <Receipt className="h-5 w-5 text-tier-pro" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('subscriptionPayments')}</p>
              <p className="text-xl font-extrabold">{formatSAR(subscriptionTotal, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-orange/10">
              <Banknote className="h-5 w-5 text-accent-orange-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('commissionPayments')}</p>
              <p className="text-xl font-extrabold">{formatSAR(commissionTotal, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('invoiceCount')}</p>
              <p className="text-xl font-extrabold">{invoiceCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <PaymentsTable invoices={items} locale={locale} />
    </div>
  );
}
