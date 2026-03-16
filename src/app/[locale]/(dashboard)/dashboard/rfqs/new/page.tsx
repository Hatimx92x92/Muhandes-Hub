// =============================================================================
// New RFQ Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RFQForm } from '@/components/forms/rfq-form';
import { getTranslations } from 'next-intl/server';

export default async function NewRFQPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // All roles can create RFQs (PO, Contractor, Supplier, Buyer)
  const t = await getTranslations('dashboard.rfqs');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('newPage.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('newPage.subtitle')}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <RFQForm />
      </div>
    </div>
  );
}
