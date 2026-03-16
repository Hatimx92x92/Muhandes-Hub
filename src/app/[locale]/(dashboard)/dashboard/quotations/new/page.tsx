// =============================================================================
// New Quotation Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QuotationForm } from '@/components/forms/quotation-form';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewQuotationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Only contractor or supplier can create quotations
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['contractor', 'supplier'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const t = await getTranslations('dashboard.quotations');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('newPage.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('newPage.subtitle')}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <QuotationForm />
      </div>
    </div>
  );
}
