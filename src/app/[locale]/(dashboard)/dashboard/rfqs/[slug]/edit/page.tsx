// =============================================================================
// Dashboard — Edit RFQ Page
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { RFQForm } from '@/components/forms/rfq-form';
import { PageHeader } from '@/components/ui/page-header';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function EditRFQPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let rfq;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('rfqs').select('*').eq('id', slug).single();
    if (data) {
      const targetSlug = getEntitySlug(data, locale);
      if (targetSlug) redirect(`/dashboard/rfqs/${targetSlug}/edit`);
    }
    notFound();
  }

  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  ({ data: rfq } = await db(supabase).from('rfqs').select('*').eq(slugCol, slug).eq('poster_id', user.id).single());
  if (!rfq) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: rfq } = await db(supabase).from('rfqs').select('*').eq(fallbackCol, slug).eq('poster_id', user.id).single());
  }
  if (!rfq) notFound();

  const id = rfq.id;

  // Fetch RFQ files for editing
  const { data: rfqFiles } = await db(supabase)
    .from('rfq_files')
    .select('id, file_url, file_name, file_size, mime_type, category')
    .eq('rfq_id', id)
    .order('created_at', { ascending: false });

  const t = await getTranslations('dashboard.rfqs');

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={slug} label={getLocaleField(rfq, 'title', locale)} />
      <PageHeader title={t('editPage.title')} description={t('editPage.subtitle')} backHref="/dashboard/rfqs" />

      <Card className="p-6">
        <RFQForm
          mode="edit"
          defaultValues={{
            rfq_id: rfq.id,
            title_ar: rfq.title_ar,
            title_en: rfq.title_en,
            description_ar: rfq.description_ar,
            description_en: rfq.description_en,
            quantity: rfq.quantity ?? undefined,
            budget_min: rfq.budget_min ?? undefined,
            budget_max: rfq.budget_max ?? undefined,
            deadline: rfq.deadline ?? undefined,
            city: rfq.city ?? undefined,
            product_id: rfq.product_id ?? undefined,
            status: rfq.status,
            existingFiles: rfqFiles ?? [],
          }}
        />
      </Card>
    </div>
  );
}
