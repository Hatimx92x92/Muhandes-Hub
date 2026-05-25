// =============================================================================
// Dashboard — Edit Quotation Page
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { QuotationForm } from '@/components/forms/quotation-form';
import { PageHeader } from '@/components/ui/page-header';
import { getTranslations } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: quotation } = await db(supabase)
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation || quotation.sender_id !== user.id) notFound();

  // Cannot edit accepted quotations
  if (quotation.status === 'accepted') {
    redirect(`/dashboard/quotations/${id}`);
  }

  const t = await getTranslations('dashboard.quotations');

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={id} label={`#${quotation.number}`} />
      <PageHeader title={t('editPage.title')} description={t('editPage.subtitle')} backHref="/dashboard/quotations" />

      <Card className="p-6">
        <QuotationForm
          formMode="edit"
          mode={quotation.mode || 'standalone'}
          defaultValues={{
            quotation_id: quotation.id,
            mode: quotation.mode || 'standalone',
            recipient_id: quotation.recipient_id ?? undefined,
            inquiry_id: quotation.inquiry_id ?? undefined,
            rfq_response_id: quotation.rfq_response_id ?? undefined,
            hire_request_id: quotation.hire_request_id ?? undefined,
            client_name: quotation.client_name ?? undefined,
            project_ref: quotation.project_ref ?? undefined,
            line_items: quotation.line_items ?? [],
            validity_days: quotation.validity_days ?? 14,
            payment_terms_ar: quotation.payment_terms_ar ?? undefined,
            payment_terms_en: quotation.payment_terms_en ?? undefined,
            delivery_terms_ar: quotation.delivery_terms_ar ?? undefined,
            delivery_terms_en: quotation.delivery_terms_en ?? undefined,
            notes_ar: quotation.notes_ar ?? undefined,
            notes_en: quotation.notes_en ?? undefined,
            status: quotation.status,
          }}
        />
      </Card>
    </div>
  );
}
