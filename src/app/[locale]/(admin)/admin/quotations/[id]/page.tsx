// =============================================================================
// Admin — Quotation Detail/Edit Page
// =============================================================================

import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getQuotationDetails } from '@/actions/admin/moderation';
import { Card } from '@/components/ui/card';
import { QuotationForm } from '@/components/forms/quotation-form';
import { getLocaleField } from '@/lib/utils';

export default async function AdminQuotationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const result = await getQuotationDetails(id);
  if (!result.data) notFound();

  const q = result.data as Record<string, unknown>;
  const sender = q.sender as Record<string, string> | null;
  const recipient = q.recipient as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('quotationEdit.title')}</h1>
        <p className="text-muted-foreground">{t('quotationEdit.subtitle')}</p>
      </div>

      {/* Sender & recipient info */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sender && (
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{t('quotationEdit.sender')}</h2>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">{t('table.columns.name')}: </span>
                <span className="font-medium">{sender.full_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('table.columns.company')}: </span>
                <span className="font-medium">{getLocaleField(sender, 'company_name', locale)}</span>
              </div>
            </div>
          </Card>
        )}
        {recipient && (
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{t('quotationEdit.recipient')}</h2>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">{t('table.columns.name')}: </span>
                <span className="font-medium">{recipient.full_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('table.columns.company')}: </span>
                <span className="font-medium">{getLocaleField(recipient, 'company_name', locale)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quotation form in admin mode */}
      <Card className="p-6">
        <QuotationForm
          formMode="admin"
          mode={(q.mode as 'inquiry_response' | 'standalone') || 'standalone'}
          defaultValues={{
            quotation_id: id,
            mode: (q.mode as 'inquiry_response' | 'standalone') || 'standalone',
            recipient_id: q.recipient_id as string,
            inquiry_id: q.inquiry_id as string,
            rfq_response_id: q.rfq_response_id as string,
            hire_request_id: q.hire_request_id as string,
            client_name: q.client_name as string,
            project_ref: q.project_ref as string,
            line_items: (q.line_items as Array<{ description: string; quantity: number; unit: string; unit_price: number; total?: number }>) ?? [],
            validity_days: q.validity_days as number,
            payment_terms_ar: q.payment_terms_ar as string,
            payment_terms_en: q.payment_terms_en as string,
            delivery_terms_ar: q.delivery_terms_ar as string,
            delivery_terms_en: q.delivery_terms_en as string,
            notes_ar: q.notes_ar as string,
            notes_en: q.notes_en as string,
            status: q.status as string,
          }}
        />
      </Card>
    </div>
  );
}
