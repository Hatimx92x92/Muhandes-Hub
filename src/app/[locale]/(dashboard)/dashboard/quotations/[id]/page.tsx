// =============================================================================
// Quotation Detail Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField, getEntitySlug } from '@/lib/utils';
import { Receipt, User, Calendar, FileText, Download, ShoppingCart, Package, Pencil, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SendQuotationButton,
  AcceptQuotationButton,
  RejectQuotationButton,
  DuplicateQuotationButton,
} from '@/components/features/quotation-actions';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { Link } from '@/i18n/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  draft: 'draft',
  sent: 'pending',
  viewed: 'info',
  accepted: 'success',
  rejected: 'rejected',
  expired: 'secondary',
};

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total?: number;
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.quotations');
  const tCommon = await getTranslations('dashboard.common');

  const { data: quotation } = await db(supabase)
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) notFound();

  // Only sender or recipient can view
  const isSender = quotation.sender_id === user.id;
  const isRecipient = quotation.recipient_id === user.id;

  if (!isSender && !isRecipient) {
    redirect('/dashboard/quotations');
  }

  // Auto-mark as viewed when recipient opens a sent quotation
  if (isRecipient && quotation.status === 'sent') {
    await db(supabase)
      .from('quotations')
      .update({ status: 'viewed' })
      .eq('id', id);
    quotation.status = 'viewed';
  }

  // Resolve source entity (RFQ or Inquiry)
  let sourceInfo: { type: 'rfq' | 'inquiry'; label: string; href: string } | null = null;
  if (quotation.rfq_response_id) {
    const { data: rfqResp } = await db(supabase)
      .from('rfq_responses')
      .select('rfq_id')
      .eq('id', quotation.rfq_response_id)
      .single();
    if (rfqResp?.rfq_id) {
      const { data: rfq } = await db(supabase)
        .from('rfqs')
        .select('title_ar, title_en, slug_ar, slug_en')
        .eq('id', rfqResp.rfq_id)
        .single();
      if (rfq) {
        const rfqSlug = getEntitySlug(rfq, locale);
        sourceInfo = {
          type: 'rfq',
          label: getLocaleField(rfq, 'title', locale),
          href: `/dashboard/rfqs/${rfqSlug}`,
        };
      }
    }
  } else if (quotation.inquiry_id) {
    const { data: inquiry } = await db(supabase)
      .from('inquiries')
      .select('product_id, products(name_ar, name_en)')
      .eq('id', quotation.inquiry_id)
      .single();
    if (inquiry?.products) {
      const prodData = inquiry.products as { name_ar: string; name_en: string };
      sourceInfo = {
        type: 'inquiry',
        label: getLocaleField(prodData, 'name', locale),
        href: `/dashboard/inquiries/${quotation.inquiry_id}`,
      };
    }
  }

  // Fetch linked deal for accepted quotations
  let linkedDeal: { id: string; title_slug: string | null; title_ar: string | null; title_en: string | null } | null = null;
  if (quotation.status === 'accepted') {
    const { data: dealData } = await db(supabase)
      .from('deals')
      .select('id, title_slug, title_ar, title_en')
      .eq('quotation_id', quotation.id)
      .maybeSingle();
    linkedDeal = dealData;
  }

  const lineItems: LineItem[] = Array.isArray(quotation.line_items)
    ? quotation.line_items
    : [];

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={id} label={quotation.number} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {t('quotationNumber')} {quotation.number}
            </h1>
            <Badge variant={statusBadge[quotation.status] || 'secondary'}>
              {quotation.status === 'sent' ? t('sent') : quotation.status === 'accepted' ? t('accepted') : quotation.status === 'expired' ? t('expired') : quotation.status === 'viewed' ? tCommon('viewed') : tCommon(quotation.status as 'draft' | 'rejected')}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('createdOn')} {formatDate(quotation.created_at, locale)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {linkedDeal && (() => {
            const dealTitle = locale === 'ar'
              ? (linkedDeal.title_ar || linkedDeal.title_en)
              : (linkedDeal.title_en || linkedDeal.title_ar);
            return (
              <Link href={`/dashboard/deals/${linkedDeal.title_slug || linkedDeal.id}`}>
                <Button variant="primary" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  {dealTitle || t('viewDeal')}
                </Button>
              </Link>
            );
          })()}
          <a href={`/api/pdf/quotation/${quotation.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              {t('downloadPdf')}
            </Button>
          </a>
          {isSender && quotation.status !== 'accepted' && (
            <Link href={`/dashboard/quotations/${quotation.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 me-1" />
                {tCommon('edit')}
              </Button>
            </Link>
          )}
          {isSender && quotation.status === 'draft' && (
            <SendQuotationButton quotationId={quotation.id} />
          )}
          {isSender && (
            <DuplicateQuotationButton quotationId={quotation.id} />
          )}
          {isRecipient && (quotation.status === 'sent' || quotation.status === 'viewed') && (
            <>
              <AcceptQuotationButton quotationId={quotation.id} />
              <RejectQuotationButton quotationId={quotation.id} />
            </>
          )}
        </div>
      </div>

      {/* Accepted-state banner linking to deal */}
      {linkedDeal && (
        <Card className="flex items-center gap-3 p-4 border-success/30 bg-success/5">
          <CheckCircle className="h-4 w-4 text-success shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">{t('dealCreated')}</span>
        </Card>
      )}

      {/* Source Info (RFQ or Inquiry) */}
      {sourceInfo && (
        <Card className="flex items-center gap-3 p-4 border-primary/20 bg-primary/5">
          {sourceInfo.type === 'rfq' ? (
            <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Package className="h-4 w-4 text-primary shrink-0" />
          )}
          <span className="text-sm text-muted-foreground">
            {sourceInfo.type === 'rfq' ? t('sourceRfq') : t('sourceInquiry')}:
          </span>
          <Link href={sourceInfo.href} className="text-sm font-medium text-primary hover:underline truncate">
            {sourceInfo.label}
          </Link>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <User className="h-4 w-4" />
            {t('client')}
          </div>
          <p className="font-medium text-foreground">
            {quotation.client_name || '—'}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="h-4 w-4" />
            {t('reference')}
          </div>
          <p className="font-medium text-foreground">
            {quotation.project_ref || '—'}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            {t('validity')}
          </div>
          <p className="font-medium text-foreground">
            {quotation.validity_days} {tCommon('day')}
          </p>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{t('lineItems')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{tCommon('description')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{tCommon('quantity')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('unit')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('unitPrice')}</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => {
                const lineTotal = item.total ?? item.quantity * item.unit_price;
                return (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-foreground">{item.description}</td>
                    <td className="px-4 py-3 text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-foreground">{item.unit}</td>
                    <td className="px-4 py-3 text-foreground">{formatSAR(item.unit_price, locale)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatSAR(lineTotal, locale)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('subtotal')}</span>
            <span className="font-medium text-foreground">{formatSAR(quotation.subtotal || 0, locale)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('vat')}</span>
            <span className="font-medium text-foreground">{formatSAR(quotation.vat_amount || 0, locale)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold border-t border-border pt-2">
            <span className="text-foreground">{t('total')}</span>
            <span className="text-primary">{formatSAR(quotation.total || 0, locale)}</span>
          </div>
        </div>
      </Card>

      {/* Terms & Notes */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(quotation.payment_terms_ar || quotation.payment_terms_en) && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('paymentTerms')}</h3>
            {quotation.payment_terms_ar && (
              <p className="text-sm text-muted-foreground">{quotation.payment_terms_ar}</p>
            )}
            {quotation.payment_terms_en && (
              <p className="text-sm text-muted-foreground mt-1" dir="ltr">{quotation.payment_terms_en}</p>
            )}
          </Card>
        )}
        {(quotation.delivery_terms_ar || quotation.delivery_terms_en) && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">{t('deliveryTerms')}</h3>
            {quotation.delivery_terms_ar && (
              <p className="text-sm text-muted-foreground">{quotation.delivery_terms_ar}</p>
            )}
            {quotation.delivery_terms_en && (
              <p className="text-sm text-muted-foreground mt-1" dir="ltr">{quotation.delivery_terms_en}</p>
            )}
          </Card>
        )}
        {(quotation.notes_ar || quotation.notes_en) && (
          <Card className="p-4 sm:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">{tCommon('notes')}</h3>
            {quotation.notes_ar && (
              <p className="text-sm text-muted-foreground">{quotation.notes_ar}</p>
            )}
            {quotation.notes_en && (
              <p className="text-sm text-muted-foreground mt-1" dir="ltr">{quotation.notes_en}</p>
            )}
          </Card>
        )}
      </div>

    </div>
  );
}
