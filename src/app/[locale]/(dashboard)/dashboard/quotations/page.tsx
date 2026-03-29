// =============================================================================
// Quotation List Page — Dashboard
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import {
  QuotationsTableClient,
  type QuotationItem,
} from '@/components/features/quotations/quotations-table-client';
import { bulkDeleteDraftQuotations, bulkSendQuotations } from '@/actions/quotations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.quotations');
  const tCommon = await getTranslations('dashboard.common');

  // Check role — contractor or supplier can send quotations; everyone can receive
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  const canCreate = role === 'contractor' || role === 'supplier';

  // Fetch sent quotations
  let sentQuery = db(supabase)
    .from('quotations')
    .select('id, number, mode, recipient_id, client_name, subtotal, vat_amount, total, validity_days, status, created_at')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  if (params.status) {
    sentQuery = sentQuery.eq('status', params.status);
  }

  const { data: sentQuotations } = await sentQuery.limit(100);

  // Fetch received quotations
  const { data: receivedQuotations } = await db(supabase)
    .from('quotations')
    .select('id, number, mode, sender_id, client_name, subtotal, vat_amount, total, validity_days, status, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const sentItems: QuotationItem[] = (sentQuotations ?? []).map((q: Record<string, unknown>) => ({
    id: q.id as string,
    number: q.number as string,
    mode: q.mode as string,
    client_name: q.client_name as string | null,
    subtotal: q.subtotal as number,
    vat_amount: q.vat_amount as number,
    total: q.total as number,
    validity_days: q.validity_days as number,
    status: q.status as string,
    created_at: q.created_at as string,
  }));

  const receivedItems: QuotationItem[] = (receivedQuotations ?? []).map((q: Record<string, unknown>) => ({
    id: q.id as string,
    number: q.number as string,
    mode: q.mode as string,
    client_name: q.client_name as string | null,
    subtotal: q.subtotal as number,
    vat_amount: q.vat_amount as number,
    total: q.total as number,
    validity_days: q.validity_days as number,
    status: q.status as string,
    created_at: q.created_at as string,
  }));

  // Build translation map for client component
  const translations: Record<string, string> = {
    number: '#',
    status: tCommon('status'),
    client: t('client'),
    total: t('total'),
    validity: t('validity'),
    days: tCommon('days'),
    created: tCommon('createdAt'),
    markSent: t('markSent'),
    deleteDraft: tCommon('delete'),
    noSent: t('noSentQuotations'),
    noSentDesc: t('noSentQuotationsDesc'),
    noReceived: t('noReceivedQuotations'),
    noReceivedDesc: t('noReceivedQuotationsDesc'),
    status_draft: tCommon('draft'),
    status_sent: t('sent'),
    status_viewed: tCommon('viewed'),
    status_accepted: t('accepted'),
    status_rejected: tCommon('rejected'),
    status_expired: tCommon('expired'),
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/quotations/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t('new')}
          </Link>
        )}
      </div>

      {/* Status filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/dashboard/quotations"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            !params.status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {tCommon('all')}
        </Link>
        {(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'] as const).map((key) => (
          <Link
            key={key}
            href={`/dashboard/quotations?status=${key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              params.status === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {key === 'sent' ? t('sent') : key === 'accepted' ? t('accepted') : key === 'expired' ? t('expired') : key === 'viewed' ? tCommon('viewed') : tCommon(key as 'draft' | 'rejected')}
          </Link>
        ))}
      </div>

      {/* Sent Quotations */}
      {canCreate && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t('sentQuotations')} ({sentItems.length})
          </h2>
          <QuotationsTableClient
            items={sentItems}
            direction="sent"
            translations={translations}
            onBulkDelete={async (ids: string[]) => {
              'use server';
              await bulkDeleteDraftQuotations(ids);
            }}
            onBulkSend={async (ids: string[]) => {
              'use server';
              await bulkSendQuotations(ids);
            }}
          />
        </section>
      )}

      {/* Received Quotations */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t('receivedQuotations')} ({receivedItems.length})
        </h2>
        <QuotationsTableClient
          items={receivedItems}
          direction="received"
          translations={translations}
        />
      </section>
    </div>
  );
}
