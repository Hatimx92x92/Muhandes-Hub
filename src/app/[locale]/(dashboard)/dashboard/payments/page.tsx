// =============================================================================
// Payments Page — unified view of all subscription + commission payments
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth-guards';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CreditCard, Receipt, Banknote, FileText } from 'lucide-react';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { formatSAR } from '@/lib/utils';
import { getInvoices } from '@/actions/subscriptions';
import { PaymentsTable } from '@/components/features/payments-table';

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Role guard — only contractor & supplier have payments
  await requireRole(['contractor', 'supplier']);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.payments');

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
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CreditCard className="h-5 w-5 text-primary" />} label={t('totalPaid')} value={formatSAR(totalPaid, locale)} color="blue" />
        <StatCard icon={<Receipt className="h-5 w-5 text-primary" />} label={t('subscriptionPayments')} value={formatSAR(subscriptionTotal, locale)} />
        <StatCard icon={<Banknote className="h-5 w-5 text-warning" />} label={t('commissionPayments')} value={formatSAR(commissionTotal, locale)} color="yellow" />
        <StatCard icon={<FileText className="h-5 w-5 text-muted-foreground" />} label={t('invoiceCount')} value={invoiceCount} />
      </div>

      {/* Payments Table */}
      <PaymentsTable invoices={items} locale={locale} />
    </div>
  );
}
