// =============================================================================
// Invoice History — Client component with filter tabs + table
// =============================================================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, formatSAR } from '@/lib/utils';
import { Download, Receipt } from 'lucide-react';
import { EmptyState } from '@/components/features/empty-state';
import type { InvoiceRecord } from '@/actions/subscriptions';

interface InvoiceHistoryProps {
  invoices: InvoiceRecord[];
  locale: string;
}

type FilterType = 'all' | 'subscription' | 'commission';

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function InvoiceHistory({ invoices, locale }: InvoiceHistoryProps) {
  const t = useTranslations('dashboard.subscription.invoiceHistory');
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter((inv) => inv.type === filter);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'subscription', label: t('filterSubscription') },
    { key: 'commission', label: t('filterCommission') },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title={t('noInvoices')}
          description={t('noInvoicesDescription')}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('invoiceNumber')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('type')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('reference')}</th>
                  <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('total')}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted-foreground">{t('issuedAt')}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.number}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        inv.type === 'subscription'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent-orange/10 text-accent-orange-foreground',
                      )}>
                        {inv.type === 'subscription' ? t('typeSubscription') : t('typeCommission')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{inv.reference_label}</td>
                    <td className="px-4 py-3 text-end font-medium text-foreground">{formatSAR(inv.total, locale)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(inv.issued_at, locale)}</td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={`/api/pdf/invoice/${inv.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t('download')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{inv.number}</span>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    inv.type === 'subscription'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent-orange/10 text-accent-orange-foreground',
                  )}>
                    {inv.type === 'subscription' ? t('typeSubscription') : t('typeCommission')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{inv.reference_label}</span>
                  <span className="font-medium text-foreground">{formatSAR(inv.total, locale)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(inv.issued_at, locale)}</span>
                  <a
                    href={`/api/pdf/invoice/${inv.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('download')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
