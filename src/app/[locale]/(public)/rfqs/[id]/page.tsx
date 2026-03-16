// =============================================================================
// Public RFQ Detail Page
// =============================================================================

import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { ShoppingCart, Calendar, Banknote, MessageSquare, ArrowRight, User } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function PublicRFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations('public.rfqDetail');
  const locale = await getLocale();

  const { data: rfq } = await db(supabase)
    .from('rfqs')
    .select('id, title_ar, title_en, description_ar, description_en, quantity, budget_min, budget_max, deadline, response_count, created_at, poster_id')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!rfq) notFound();

  const { data: poster } = await db(supabase)
    .from('profiles')
    .select('full_name, company_name_ar, company_name_en, role')
    .eq('id', rfq.poster_id)
    .single();

  const title = getLocaleField(rfq, 'title', locale);
  const description = getLocaleField(rfq, 'description', locale);
  const isExpired = rfq.deadline && new Date(rfq.deadline) < new Date();

  const roleLabels: Record<string, string> = {
    project_owner: t('roleProjectOwner'),
    contractor: t('roleContractor'),
    supplier: t('roleSupplier'),
    buyer: t('roleBuyer'),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-2">
          <ShoppingCart className="h-7 w-7 text-primary mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            {rfq.title_en && (
              <h2 className="text-lg text-muted-foreground mt-1" dir="ltr">{rfq.title_en}</h2>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {isExpired ? (
            <Badge variant="secondary">{t('deadlineExpired')}</Badge>
          ) : (
            <Badge variant="published">{t('open')}</Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {t('publishedAt', { date: formatDate(rfq.created_at) })}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-3">{t('description')}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {description}
            </p>
            {rfq.description_en && locale === 'ar' && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed" dir="ltr">
                  {rfq.description_en}
                </p>
              </div>
            )}
          </Card>

          {!isExpired && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('areYouSupplier')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('loginToRespondDesc')}
              </p>
              <Link
                href={`/login?redirect=/dashboard/rfqs/${rfq.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('loginToRespond')}
              </Link>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('requestDetails')}</h3>

            {(rfq.budget_min || rfq.budget_max) && (
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('budgetLabel')}</p>
                  <p className="font-medium text-foreground">
                    {rfq.budget_min ? `${formatSAR(rfq.budget_min)} — ` : ''}
                    {rfq.budget_max ? formatSAR(rfq.budget_max) : t('unspecified')}
                  </p>
                </div>
              </div>
            )}

            {rfq.quantity && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">{t('quantityRequired')}</p>
                <p className="font-medium text-foreground">{rfq.quantity}</p>
              </div>
            )}

            {rfq.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('deadline')}</p>
                  <p className="font-medium text-foreground">{formatDate(rfq.deadline)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('responses')}</p>
                <p className="font-medium text-foreground">{t('responseCount', { count: rfq.response_count ?? 0 })}</p>
              </div>
            </div>
          </Card>

          {poster && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('poster')}</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {locale === 'ar'
                      ? (poster.company_name_ar || poster.full_name)
                      : (poster.company_name_en || poster.company_name_ar || poster.full_name)}
                  </p>
                  <Badge variant={poster.role as 'contractor' | 'supplier' | 'buyer' | 'project_owner'} className="mt-0.5">
                    {roleLabels[poster.role] || poster.role}
                  </Badge>
                </div>
              </div>
              <Link
                href={`/partners/${rfq.poster_id}`}
                className="mt-3 block text-xs text-primary hover:underline"
              >
                {t('viewProfile')}
              </Link>
            </Card>
          )}
        </div>
      </div>

      <Link
        href="/rfqs"
        className="mt-8 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t('backToRfqs')}
      </Link>
    </div>
  );
}
