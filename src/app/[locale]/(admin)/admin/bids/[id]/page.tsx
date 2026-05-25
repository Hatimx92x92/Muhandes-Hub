// =============================================================================
// Admin — Bid Detail/Edit Page
// =============================================================================

import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBidDetails } from '@/actions/admin/moderation';
import { Card } from '@/components/ui/card';
import { BidForm } from '@/components/forms/bid-form';
import { getLocaleField } from '@/lib/utils';

export default async function AdminBidDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const result = await getBidDetails(id);
  if (!result.data) notFound();

  const bid = result.data as {
    id: string;
    project_id: string;
    amount: number;
    timeline_days: number;
    methodology_ar: string | null;
    methodology_en: string | null;
    status: string;
    project: { id: string; title_ar: string; title_en: string } | null;
    contractor: { id: string; full_name: string; company_name_ar: string; company_name_en: string; email: string; phone: string } | null;
  };

  const projectTitle = bid.project ? getLocaleField(bid.project, 'title', locale) || '—' : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('bidEdit.title')}</h1>
        <p className="text-muted-foreground">{t('bidEdit.subtitle')}</p>
      </div>

      {/* Contractor info */}
      {bid.contractor && (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">{t('bidEdit.contractor')}</h2>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">{t('table.columns.name')}: </span>
              <span className="font-medium">{bid.contractor.full_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('table.columns.company')}: </span>
              <span className="font-medium">{bid.contractor ? getLocaleField(bid.contractor, 'company_name', locale) : '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('table.columns.email')}: </span>
              <span className="font-medium">{bid.contractor.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('table.columns.phone')}: </span>
              <span className="font-medium">{bid.contractor.phone}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Bid form in admin mode */}
      <Card className="p-6">
        <BidForm
          mode="admin"
          defaultValues={{
            bid_id: bid.id,
            project_id: bid.project_id,
            amount: bid.amount,
            timeline_days: bid.timeline_days,
            methodology_ar: bid.methodology_ar ?? undefined,
            methodology_en: bid.methodology_en ?? undefined,
            status: bid.status,
            projectTitle,
          }}
        />
      </Card>
    </div>
  );
}
