// =============================================================================
// Inquiries Page — Dashboard (for suppliers to view received product inquiries)
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { getLocaleField } from '@/lib/utils';
import {
  InquiriesTableClient,
  type InquiryItem,
} from '@/components/features/inquiries/inquiries-table-client';
import { bulkMarkInquiriesResponded, bulkCloseInquiries } from '@/actions/inquiries';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ product_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.inquiries');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  // Get products owned by this supplier, then get inquiries for those products
  const { data: myProducts } = await db(supabase)
    .from('products')
    .select('id')
    .eq('supplier_id', user.id);

  const productIds = (myProducts ?? []).map((p: { id: string }) => p.id);

  // If product_id filter is set, make sure it belongs to this supplier
  const filterProductId = params.product_id && productIds.includes(params.product_id) ? params.product_id : null;

  let rawInquiries: Array<{
    id: string;
    product_id: string;
    sender_id: string;
    quantity: number | null;
    requirements_ar: string | null;
    requirements_en: string | null;
    status: string;
    created_at: string;
    products: { name_ar: string; name_en: string; slug_ar: string | null; slug_en: string | null } | null;
    profiles: { company_name_ar: string; company_name_en: string; slug_ar: string | null; slug_en: string | null } | null;
  }> = [];

  if (productIds.length > 0) {
    let query = db(supabase)
      .from('inquiries')
      .select('id, product_id, sender_id, quantity, requirements_ar, requirements_en, status, created_at, products(name_ar, name_en, slug_ar, slug_en), profiles:sender_id(company_name_ar, company_name_en, slug_ar, slug_en)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterProductId) {
      query = query.eq('product_id', filterProductId);
    } else {
      query = query.in('product_id', productIds);
    }

    const { data } = await query;
    rawInquiries = data ?? [];
  }

  const items: InquiryItem[] = rawInquiries.map((inq) => ({
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

  const translations: Record<string, string> = {
    status: tCommon('status'),
    product: tCommon('product'),
    sender: t('sender'),
    quantity: tCommon('quantity'),
    requirements: t('requirements'),
    created: tCommon('createdAt'),
    markResponded: t('markResponded'),
    close: tCommon('closed'),
    empty: t('empty'),
    emptyDescription: t('emptyDescription'),
    status_pending: tCommon('pending'),
    status_responded: t('status.responded'),
    status_closed: tCommon('closed'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <InquiriesTableClient
        items={items}
        translations={translations}
        onBulkRespond={async (ids: string[]) => {
          'use server';
          await bulkMarkInquiriesResponded(ids);
        }}
        onBulkClose={async (ids: string[]) => {
          'use server';
          await bulkCloseInquiries(ids);
        }}
      />
    </div>
  );
}
