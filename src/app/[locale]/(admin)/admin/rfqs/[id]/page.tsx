// =============================================================================
// Admin — RFQ Detail/Edit Page
// =============================================================================

import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPostDetails } from '@/actions/admin/moderation';
import { Card } from '@/components/ui/card';
import { RFQForm } from '@/components/forms/rfq-form';
import { getLocaleField } from '@/lib/utils';

export default async function AdminRFQDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const result = await getPostDetails(id, 'rfq');
  if (!result.data) notFound();

  const rfq = result.data as Record<string, unknown>;
  const owner = rfq.owner as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('rfqEdit.title')}</h1>
        <p className="text-muted-foreground">{t('rfqEdit.subtitle')}</p>
      </div>

      {/* Poster info */}
      {owner && (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">{t('rfqEdit.poster')}</h2>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">{t('table.columns.name')}: </span>
              <span className="font-medium">{owner.full_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('table.columns.company')}: </span>
              <span className="font-medium">{getLocaleField(owner, 'company_name', locale)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* RFQ form in admin mode */}
      <Card className="p-6">
        <RFQForm
          mode="admin"
          defaultValues={{
            rfq_id: id,
            title_ar: rfq.title_ar as string,
            title_en: rfq.title_en as string,
            description_ar: rfq.description_ar as string,
            description_en: rfq.description_en as string,
            quantity: rfq.quantity as number,
            budget_min: rfq.budget_min as number,
            budget_max: rfq.budget_max as number,
            deadline: rfq.deadline as string,
            city: rfq.city_id as string,
            product_id: rfq.product_id as string,
            status: rfq.status as string,
            existingFiles: (rfq.files as Array<{ id: string; file_url: string; file_name: string; file_size: number; category: string; mime_type?: string }>) ?? [],
          }}
        />
      </Card>
    </div>
  );
}
