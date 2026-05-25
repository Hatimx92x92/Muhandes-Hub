// =============================================================================
// Admin — RFQs List Page
// =============================================================================

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { listAllRFQs } from '@/actions/admin/moderation';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ShoppingCart } from 'lucide-react';

const statusBadge: Record<string, BadgeProps['variant']> = {
  draft: 'draft',
  pending: 'pending',
  published: 'published',
  rejected: 'rejected',
  closed: 'secondary',
  expired: 'secondary',
};

export default async function AdminRFQsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const params = await searchParams;

  const result = await listAllRFQs({ status: params.status });

  const rfqs = (result.data ?? []) as Array<{
    id: string;
    title_ar: string;
    title_en: string;
    status: string;
    created_at: string;
    deadline: string | null;
    quantity: number | null;
    budget_min: number | null;
    budget_max: number | null;
    profiles: { full_name: string; company_name_ar: string; company_name_en: string } | null;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('rfqsPage.title')}</h1>
          <p className="text-muted-foreground">{t('rfqsPage.subtitle')}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'draft', 'pending', 'published', 'rejected', 'closed'].map((s) => (
          <Link
            key={s}
            href={`/admin/rfqs${s ? `?status=${s}` : ''}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              (params.status || '') === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {s ? t(`postStatus.${s}` as 'postStatus.pending') : t('all')}
          </Link>
        ))}
      </div>

      {/* RFQs table */}
      {rfqs.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {t('rfqsPage.noRfqs')}
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.title')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.poster')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.budget')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.status')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.deadline')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/rfqs/${rfq.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {getLocaleField(rfq, 'title', locale) || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rfq.profiles?.full_name || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {rfq.budget_max
                      ? `${rfq.budget_min ? `${formatSAR(rfq.budget_min)} - ` : ''}${formatSAR(rfq.budget_max)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[rfq.status] || 'secondary'}>
                      {t(`postStatus.${rfq.status}` as 'postStatus.pending')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rfq.deadline ? formatDate(rfq.deadline) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(rfq.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
