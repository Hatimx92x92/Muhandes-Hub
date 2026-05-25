// =============================================================================
// Admin — Quotations List Page
// =============================================================================

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { listAllQuotations } from '@/actions/admin/moderation';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { Receipt } from 'lucide-react';

const statusBadge: Record<string, BadgeProps['variant']> = {
  draft: 'draft',
  sent: 'pending',
  viewed: 'info',
  accepted: 'success',
  rejected: 'rejected',
  expired: 'secondary',
};

export default async function AdminQuotationsPage({
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

  const result = await listAllQuotations({ status: params.status });

  const quotations = (result.data ?? []) as Array<{
    id: string;
    number: string;
    total: number;
    status: string;
    created_at: string;
    client_name: string | null;
    profiles: { full_name: string; company_name_ar: string; company_name_en: string } | null;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('quotationsPage.title')}</h1>
          <p className="text-muted-foreground">{t('quotationsPage.subtitle')}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'].map((s) => (
          <Link
            key={s}
            href={`/admin/quotations${s ? `?status=${s}` : ''}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              (params.status || '') === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {s ? t(`quotationStatus.${s}` as 'quotationStatus.draft') : t('all')}
          </Link>
        ))}
      </div>

      {/* Quotations table */}
      {quotations.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {t('quotationsPage.noQuotations')}
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.number')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.sender')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.client')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.total')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.status')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('table.columns.created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/quotations/${q.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {q.profiles?.full_name || '—'}
                    <div className="text-xs">
                      {q.profiles ? getLocaleField(q.profiles, 'company_name', locale) : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {q.client_name || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatSAR(q.total)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[q.status] || 'secondary'}>
                      {t(`quotationStatus.${q.status}` as 'quotationStatus.draft')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(q.created_at)}
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
