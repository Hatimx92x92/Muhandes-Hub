// =============================================================================
// New RFQ Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RFQForm } from '@/components/forms/rfq-form';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function NewRFQPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.rfqs');

  return (
    <div className="space-y-6">
      <PageHeader title={t('newPage.title')} description={t('newPage.subtitle')} backHref="/dashboard/rfqs" />
      <Card className="p-6">
        <RFQForm />
      </Card>
    </div>
  );
}
