// =============================================================================
// Quotation List Page — Dashboard (Sent + Received with tab toggle)
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { getTranslations } from 'next-intl/server';
import {
  QuotationsTableClient,
  type QuotationItem,
} from '@/components/features/quotations/quotations-table-client';
import { bulkDeleteDraftQuotations, bulkSendQuotations } from '@/actions/quotations';
import { DirectionTabs } from '@/components/features/direction-tabs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; page?: string; search?: string; sort?: string }>;
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

  const activeView = params.view === 'sent' || params.view === 'received'
    ? params.view
    : canCreate ? 'sent' : 'received';

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    amountHigh: { column: 'total', ascending: false },
    amountLow: { column: 'total', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // Fetch sent quotations with pagination
  let sentQuery = db(supabase)
    .from('quotations')
    .select('id, number, mode, recipient_id, client_name, subtotal, vat_amount, total, validity_days, status, created_at', { count: 'exact' })
    .eq('sender_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status) {
    sentQuery = sentQuery.eq('status', params.status);
  }
  if (search) {
    sentQuery = sentQuery.or(`number.ilike.%${search}%,client_name.ilike.%${search}%`);
  }

  // Fetch received quotations with pagination
  let recvQuery = db(supabase)
    .from('quotations')
    .select('id, number, mode, sender_id, client_name, subtotal, vat_amount, total, validity_days, status, created_at', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status) {
    recvQuery = recvQuery.eq('status', params.status);
  }
  if (search) {
    recvQuery = recvQuery.or(`number.ilike.%${search}%,client_name.ilike.%${search}%`);
  }

  // Paginate active view, limit inactive to count only
  let sentData, sentCount, recvData, recvCount;
  if (activeView === 'sent') {
    ({ data: sentData, count: sentCount } = await sentQuery.range((page - 1) * perPage, page * perPage - 1));
    ({ count: recvCount } = await db(supabase)
      .from('quotations').select('id', { count: 'exact' })
      .eq('recipient_id', user.id));
  } else {
    ({ data: recvData, count: recvCount } = await recvQuery.range((page - 1) * perPage, page * perPage - 1));
    ({ count: sentCount } = await db(supabase)
      .from('quotations').select('id', { count: 'exact' })
      .eq('sender_id', user.id));
  }

  const mapQuotation = (q: Record<string, unknown>): QuotationItem => ({
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
  });

  const sentItems = (sentData ?? []).map(mapQuotation);
  const receivedItems = (recvData ?? []).map(mapQuotation);
  const items = activeView === 'sent' ? sentItems : receivedItems;
  const totalCount = activeView === 'sent' ? (sentCount ?? 0) : (recvCount ?? 0);
  const totalPages = Math.ceil(totalCount / perPage);

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

  // Filter groups
  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: [
        { value: 'draft', label: tCommon('draft') },
        { value: 'sent', label: t('sent') },
        { value: 'viewed', label: tCommon('viewed') },
        { value: 'accepted', label: t('accepted') },
        { value: 'rejected', label: tCommon('rejected') },
        { value: 'expired', label: tCommon('expired') },
      ],
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
    { value: 'amountHigh', label: t('total') + ' ↓' },
    { value: 'amountLow', label: t('total') + ' ↑' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          canCreate ? (
            <Link href="/dashboard/quotations/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t('new')}
            </Link>
          ) : undefined
        }
      />

      {/* Direction Tabs */}
      <DirectionTabs
          tabs={[
            ...(canCreate ? [{ key: 'sent', label: t('sentTab', { count: sentCount ?? 0 }).replace(` (${sentCount ?? 0})`, ''), count: sentCount ?? 0, href: '/dashboard/quotations?view=sent' }] : []),
            { key: 'received', label: t('receivedTab', { count: recvCount ?? 0 }).replace(` (${recvCount ?? 0})`, ''), count: recvCount ?? 0, href: '/dashboard/quotations?view=received' },
          ]}
          activeTab={activeView}
        />

      {/* Active Table */}
      <QuotationsTableClient
        items={items}
        direction={activeView as 'sent' | 'received'}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        translations={translations}
        filterGroups={filterGroups}
        sortOptions={sortOptions}
        onBulkDelete={activeView === 'sent' ? async (ids: string[]) => {
          'use server';
          await bulkDeleteDraftQuotations(ids);
        } : undefined}
        onBulkSend={activeView === 'sent' ? async (ids: string[]) => {
          'use server';
          await bulkSendQuotations(ids);
        } : undefined}
      />
    </div>
  );
}
