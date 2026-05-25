// =============================================================================
// Inquiries Page — Dashboard (Received + Sent with tab toggle)
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getLocaleField } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import {
  InquiriesTableClient,
  type InquiryItem,
} from '@/components/features/inquiries/inquiries-table-client';
import { bulkMarkInquiriesResponded, bulkCloseInquiries } from '@/actions/inquiries';
import { DirectionTabs } from '@/components/features/direction-tabs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function InquiriesPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product_id?: string; view?: string; status?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.inquiries');
  const tCommon = await getTranslations('dashboard.common');

  const activeView = params.view === 'sent' || params.view === 'received'
    ? params.view
    : 'received';

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // ---------------------------------------------------------------------------
  // Fetch RECEIVED inquiries (supplier — inquiries about my products)
  // ---------------------------------------------------------------------------
  const { data: myProducts } = await db(supabase)
    .from('products')
    .select('id')
    .eq('supplier_id', user.id);

  const productIds = (myProducts ?? []).map((p: { id: string }) => p.id);

  const filterProductId = params.product_id && productIds.includes(params.product_id) ? params.product_id : null;

  let receivedItems: InquiryItem[] = [];
  let receivedTotal = 0;
  if (productIds.length > 0 && activeView === 'received') {
    let query = db(supabase)
      .from('inquiries')
      .select('id, product_id, sender_id, quantity, requirements_ar, requirements_en, status, created_at, products(name_ar, name_en, slug_ar, slug_en), profiles:sender_id(company_name_ar, company_name_en, slug_ar, slug_en)', { count: 'exact' })
      .order(sortConfig.column, { ascending: sortConfig.ascending });

    if (filterProductId) {
      query = query.eq('product_id', filterProductId);
    } else {
      query = query.in('product_id', productIds);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (search) {
      query = query.or(`requirements_ar.ilike.%${search}%,requirements_en.ilike.%${search}%`);
    }

    const { data, count } = await query.range((page - 1) * perPage, page * perPage - 1);
    const rawReceived = data ?? [];
    receivedTotal = count ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receivedItems = rawReceived.map((inq: any) => ({
      id: inq.id,
      product_name: inq.products ? getLocaleField(inq.products, 'name', locale) : t('unknownProduct'),
      product_slug: inq.products ? (locale === 'ar' ? inq.products.slug_ar : inq.products.slug_en) || inq.products.slug_ar || inq.products.slug_en : null,
      sender_name: inq.profiles ? getLocaleField(inq.profiles, 'company_name', locale) : t('unknownSender'),
      sender_slug: inq.profiles ? (locale === 'ar' ? inq.profiles.slug_ar : inq.profiles.slug_en) || inq.profiles.slug_ar || inq.profiles.slug_en : null,
      quantity: inq.quantity,
      requirements: locale === 'ar'
        ? (inq.requirements_ar || inq.requirements_en)
        : (inq.requirements_en || inq.requirements_ar),
      status: inq.status,
      created_at: inq.created_at,
    }));
  }

  // Count for received tab (unfiltered)
  let receivedTabCount = 0;
  if (productIds.length > 0) {
    const { count: rc } = await db(supabase)
      .from('inquiries').select('id', { count: 'exact' })
      .in('product_id', productIds);
    receivedTabCount = rc ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Fetch SENT inquiries (buyer — inquiries I sent about other products)
  // ---------------------------------------------------------------------------
  let sentItems: InquiryItem[] = [];
  let sentTotal = 0;
  if (activeView === 'sent') {
    let sentQuery = db(supabase)
      .from('inquiries')
      .select('id, product_id, sender_id, quantity, requirements_ar, requirements_en, status, created_at, products(name_ar, name_en, slug_ar, slug_en, supplier_id, profiles:supplier_id(company_name_ar, company_name_en, slug_ar, slug_en))', { count: 'exact' })
      .eq('sender_id', user.id)
      .order(sortConfig.column, { ascending: sortConfig.ascending });

    if (params.status) {
      sentQuery = sentQuery.eq('status', params.status);
    }
    if (search) {
      sentQuery = sentQuery.or(`requirements_ar.ilike.%${search}%,requirements_en.ilike.%${search}%`);
    }

    const { data, count } = await sentQuery.range((page - 1) * perPage, page * perPage - 1);
    sentTotal = count ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sentItems = ((data ?? []) as any[]).map((inq) => ({
      id: inq.id,
      product_name: inq.products ? getLocaleField(inq.products, 'name', locale) : t('unknownProduct'),
      product_slug: inq.products ? (locale === 'ar' ? inq.products.slug_ar : inq.products.slug_en) || inq.products.slug_ar || inq.products.slug_en : null,
      sender_name: inq.products?.profiles ? getLocaleField(inq.products.profiles, 'company_name', locale) : t('unknownSender'),
      sender_slug: inq.products?.profiles ? (locale === 'ar' ? inq.products.profiles.slug_ar : inq.products.profiles.slug_en) || inq.products.profiles.slug_ar || inq.products.profiles.slug_en : null,
      quantity: inq.quantity,
      requirements: locale === 'ar'
        ? (inq.requirements_ar || inq.requirements_en)
        : (inq.requirements_en || inq.requirements_ar),
      status: inq.status,
      created_at: inq.created_at,
    }));
  }

  // Count for sent tab (unfiltered)
  const { count: sentTabCountRaw } = await db(supabase)
    .from('inquiries').select('id', { count: 'exact' })
    .eq('sender_id', user.id);
  const sentTabCount = sentTabCountRaw ?? 0;

  // ---------------------------------------------------------------------------
  // Active items + pagination
  // ---------------------------------------------------------------------------
  const items = activeView === 'received' ? receivedItems : sentItems;
  const totalCount = activeView === 'received' ? receivedTotal : sentTotal;
  const totalPages = Math.ceil(totalCount / perPage);

  const translations: Record<string, string> = {
    status: tCommon('status'),
    product: tCommon('product'),
    sender: activeView === 'received' ? t('sender') : t('supplier'),
    quantity: tCommon('quantity'),
    requirements: t('requirements'),
    created: tCommon('createdAt'),
    markResponded: t('markResponded'),
    close: tCommon('closed'),
    empty: activeView === 'received' ? t('empty') : t('noSent'),
    emptyDescription: activeView === 'received' ? t('emptyDescription') : t('noSentDescription'),
    status_pending: tCommon('pending'),
    status_responded: t('status.responded'),
    status_closed: tCommon('closed'),
  };

  // Filter groups
  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: [
        { value: 'pending', label: tCommon('pending') },
        { value: 'responded', label: t('status.responded') },
        { value: 'closed', label: tCommon('closed') },
      ],
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={activeView === 'received' ? t('title') : t('sentTitle')}
        description={activeView === 'received' ? t('description') : t('sentDescription')}
      />

      {/* Direction Tabs */}
      <DirectionTabs
        tabs={[
          { key: 'received', label: t('receivedTab', { count: receivedTabCount }).replace(` (${receivedTabCount})`, ''), count: receivedTabCount, href: '/dashboard/inquiries?view=received' },
          { key: 'sent', label: t('sentTab', { count: sentTabCount }).replace(` (${sentTabCount})`, ''), count: sentTabCount, href: '/dashboard/inquiries?view=sent' },
        ]}
        activeTab={activeView}
      />

      <InquiriesTableClient
        items={items}
        direction={activeView as 'sent' | 'received'}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        translations={translations}
        filterGroups={filterGroups}
        sortOptions={sortOptions}
        onBulkRespond={activeView === 'received' ? async (ids: string[]) => {
          'use server';
          await bulkMarkInquiriesResponded(ids);
        } : undefined}
        onBulkClose={activeView === 'received' ? async (ids: string[]) => {
          'use server';
          await bulkCloseInquiries(ids);
        } : undefined}
      />
    </div>
  );
}
