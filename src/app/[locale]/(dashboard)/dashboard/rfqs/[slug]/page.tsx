// =============================================================================
// RFQ Detail Page — Dashboard (poster view + supplier response)
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { ShoppingCart, Calendar, Banknote, MessageSquare, User, Package, Receipt } from 'lucide-react';
import { SubmitRFQButton, AcceptRFQResponseButton, RejectRFQResponseButton } from '@/components/features/rfq-actions';
import { RFQResponseForm } from '@/components/forms/rfq-response-form';
import { getTranslations, getLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { FileDisplayList } from '@/components/features/file-display-list';
import { Link } from '@/i18n/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  draft: 'draft',
  pending: 'pending',
  published: 'published',
  rejected: 'rejected',
  closed: 'secondary',
  expired: 'secondary',
};

const responseStatusBadge: Record<string, BadgeProps['variant']> = {
  pending: 'pending',
  accepted: 'success',
  rejected: 'rejected',
};

export default async function RFQDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.rfqs');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  // Slug-based RFQ lookup
  let rfq;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('rfqs').select('slug_ar, slug_en').eq('id', slug).single();
    if (data) {
      const targetSlug = getEntitySlug(data, locale);
      if (targetSlug) redirect(`/dashboard/rfqs/${targetSlug}`);
    }
    notFound();
  }

  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  ({ data: rfq } = await db(supabase).from('rfqs').select('*').eq(slugCol, slug).single());
  if (!rfq) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: rfq } = await db(supabase).from('rfqs').select('*').eq(fallbackCol, slug).single());
  }
  if (!rfq) notFound();

  const id = rfq.id;

  const isPoster = rfq.poster_id === user.id;

  // Get user role
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isSupplier = profile?.role === 'supplier';

  // Fetch responses (poster can see all, supplier sees only their own)
  let responses: ResponseItem[] = [];
  if (isPoster) {
    const { data } = await db(supabase)
      .from('rfq_responses')
      .select('id, supplier_id, pricing, delivery_terms_ar, delivery_terms_en, notes_ar, notes_en, status, created_at, quotation_id, profiles:supplier_id(full_name, company_name_ar, company_name_en, slug_ar, slug_en)')
      .eq('rfq_id', id)
      .order('created_at', { ascending: false });
    responses = (data ?? []) as ResponseItem[];
  } else if (isSupplier) {
    const { data } = await db(supabase)
      .from('rfq_responses')
      .select('id, supplier_id, pricing, delivery_terms_ar, delivery_terms_en, notes_ar, notes_en, status, created_at, quotation_id, profiles:supplier_id(full_name, company_name_ar, company_name_en, slug_ar, slug_en)')
      .eq('rfq_id', id)
      .eq('supplier_id', user.id);
    responses = (data ?? []) as ResponseItem[];
  }

  // Check if supplier already responded
  const hasResponded = isSupplier && responses.length > 0;
  const canRespond = isSupplier && rfq.status === 'published' && !hasResponded;

  // Fetch RFQ files
  const { data: rfqFiles } = await db(supabase)
    .from('rfq_files')
    .select('id, file_url, file_name, file_size, mime_type, category, created_at')
    .eq('rfq_id', id)
    .order('created_at', { ascending: false });

  // Fetch linked product (if any)
  let linkedProduct: { id: string; name_ar: string; name_en: string; price: number | null; slug_ar: string; slug_en: string } | null = null;
  if (rfq.product_id) {
    const { data } = await db(supabase)
      .from('products')
      .select('id, name_ar, name_en, price, slug_ar, slug_en')
      .eq('id', rfq.product_id)
      .single();
    linkedProduct = data;
  }

  const title = getLocaleField(rfq, 'title', locale);
  const description = getLocaleField(rfq, 'description', locale);

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={slug} label={title} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <Badge variant={statusBadge[rfq.status] || 'secondary'}>
              {tCommon(rfq.status as 'draft' | 'pending' | 'published' | 'rejected' | 'closed' | 'expired')}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('createdOn')} {formatDate(rfq.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isPoster && (rfq.status === 'draft' || rfq.status === 'rejected') && (
            <SubmitRFQButton rfqId={rfq.id} />
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rfq.budget_max && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Banknote className="h-4 w-4" />
              {tCommon('budget')}
            </div>
            <p className="font-semibold text-foreground">
              {rfq.budget_min ? `${formatSAR(rfq.budget_min)} - ` : ''}
              {formatSAR(rfq.budget_max)}
            </p>
          </Card>
        )}
        {rfq.quantity && (
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">{tCommon('quantity')}</div>
            <p className="font-semibold text-foreground">{rfq.quantity}</p>
          </Card>
        )}
        {rfq.deadline && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              {t('deadline')}
            </div>
            <p className="font-semibold text-foreground">{formatDate(rfq.deadline)}</p>
          </Card>
        )}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MessageSquare className="h-4 w-4" />
            {t('responses')}
          </div>
          <p className="font-semibold text-foreground">{rfq.response_count ?? 0} {t('response')}</p>
        </Card>
      </div>

      {/* Description */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-3">{tCommon('description')}</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
      </Card>

      {/* Linked Product */}
      {linkedProduct && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{t('linkedProduct')}</p>
              <p className="text-sm font-medium text-foreground">
                {getLocaleField(linkedProduct, 'name', locale)}
              </p>
            </div>
            {linkedProduct.price && (
              <span className="ms-auto text-sm font-semibold text-foreground">
                {formatSAR(linkedProduct.price)}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Files */}
      {rfqFiles && rfqFiles.length > 0 && (
        <FileDisplayList files={rfqFiles} title={t('attachments')} />
      )}

      {/* Responses Section (for poster) */}
      {isPoster && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t('responses')} ({responses.length})
          </h2>
          {responses.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              {t('noResponsesReceived')}
            </Card>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  canManage={isPoster && rfq.status === 'published'}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Supplier's own response */}
      {isSupplier && hasResponded && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('yourResponse')}</h2>
          {responses.map((response) => (
            <ResponseCard key={response.id} response={response} canManage={false} />
          ))}
        </section>
      )}

      {/* Response Form (for suppliers) */}
      {canRespond && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('submitResponse')}</h2>
          <Card className="p-6">
            <RFQResponseForm rfqId={rfq.id} />
          </Card>
        </section>
      )}

    </div>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ResponseItem {
  id: string;
  supplier_id: string;
  pricing: Record<string, unknown>;
  delivery_terms_ar: string | null;
  delivery_terms_en: string | null;
  notes_ar: string | null;
  notes_en: string | null;
  status: string;
  created_at: string;
  quotation_id: string | null;
  profiles: {
    full_name: string;
    company_name_ar: string | null;
    company_name_en: string | null;
    slug_ar: string | null;
    slug_en: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Response Card
// ---------------------------------------------------------------------------
async function ResponseCard({
  response,
  canManage,
}: {
  response: ResponseItem;
  canManage: boolean;
}) {
  const t = await getTranslations('dashboard.rfqs');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();
  const pricing = response.pricing || {};
  const total = (pricing as { total?: number }).total;

  const supplierName = response.profiles
    ? getLocaleField(response.profiles, 'company_name', locale) || response.profiles.full_name
    : `${t('supplierLabel')} #${response.supplier_id.slice(0, 8)}`;
  const supplierSlug = response.profiles
    ? (locale === 'ar' ? response.profiles.slug_ar : response.profiles.slug_en) || response.profiles.slug_ar || response.profiles.slug_en
    : null;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {supplierSlug ? (
              <Link href={`/partners/${supplierSlug}`} className="text-sm font-medium text-primary hover:underline">
                {supplierName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground">{supplierName}</span>
            )}
            <Badge variant={responseStatusBadge[response.status] || 'secondary'}>
              {t(`response${response.status.charAt(0).toUpperCase() + response.status.slice(1)}` as 'responsePending' | 'responseAccepted' | 'responseRejected')}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {total && (
              <span className="flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                {formatSAR(total)}
              </span>
            )}
            <span>{formatDate(response.created_at)}</span>
          </div>

          {response.delivery_terms_ar && (
            <p className="text-xs text-muted-foreground">
              {tCommon('delivery')}: {response.delivery_terms_ar}
            </p>
          )}
          {response.notes_ar && (
            <p className="text-xs text-muted-foreground">
              {tCommon('notes')}: {response.notes_ar}
            </p>
          )}

          {/* Linked Quotation */}
          {response.quotation_id && (
            <div className="pt-1">
              <Link
                href={`/dashboard/quotations/${response.quotation_id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Receipt className="h-3 w-3" />
                {t('viewQuotation')}
              </Link>
            </div>
          )}
        </div>

        {/* Accept/Reject actions */}
        {canManage && response.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <AcceptRFQResponseButton responseId={response.id} />
            <RejectRFQResponseButton responseId={response.id} />
          </div>
        )}
      </div>
    </Card>
  );
}

// Re-used in ResponseCard — declared at module scope above
