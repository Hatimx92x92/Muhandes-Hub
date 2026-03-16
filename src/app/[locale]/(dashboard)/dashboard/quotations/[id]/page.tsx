// =============================================================================
// Quotation Detail Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { formatSAR, formatDate } from '@/lib/utils';
import { Receipt, User, Calendar, FileText, ArrowRight } from 'lucide-react';
import {
  SendQuotationButton,
  AcceptQuotationButton,
  RejectQuotationButton,
} from '@/components/features/quotation-actions';
import { getTranslations, getLocale } from 'next-intl/server';

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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.quotations');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

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

  const lineItems: LineItem[] = Array.isArray(quotation.line_items)
    ? quotation.line_items
    : [];

  return (
    <div className="space-y-6">
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
            {t('createdOn')} {formatDate(quotation.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isSender && quotation.status === 'draft' && (
            <SendQuotationButton quotationId={quotation.id} />
          )}
          {isRecipient && quotation.status === 'sent' && (
            <>
              <AcceptQuotationButton quotationId={quotation.id} />
              <RejectQuotationButton quotationId={quotation.id} />
            </>
          )}
        </div>
      </div>

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

      {/* Back link */}
      <Link
        href="/dashboard/quotations"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t('backToQuotations')}
      </Link>
    </div>
  );
}
