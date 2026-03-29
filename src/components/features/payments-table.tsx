// =============================================================================
// PaymentsTable — client component with filter tabs + responsive table
// =============================================================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, formatSAR } from '@/lib/utils';
import { Download, CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/features/empty-state';
import type { InvoiceRecord } from '@/actions/subscriptions';

interface PaymentsTableProps {
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

export function PaymentsTable({ invoices, locale }: PaymentsTableProps) {
  const t = useTranslations('dashboard.payments');
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter((inv) => inv.type === filter);

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: t('filterAll'), count: invoices.length },
    { key: 'subscription', label: t('filterSubscription'), count: invoices.filter((i) => i.type === 'subscription').length },
    { key: 'commission', label: t('filterCommission'), count: invoices.filter((i) => i.type === 'commission').length },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {filters.map(({ key, label, count }) => (
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
            {label} ({count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12" />}
          title={t('noPayments')}
          description={t('noPaymentsDescription')}
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
                  <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('subtotal')}</th>
                  <th className="px-4 py-3 text-end font-medium text-muted-foreground">{t('vat')}</th>
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
                    <td className="px-4 py-3 text-end text-muted-foreground text-xs">{formatSAR(inv.subtotal, locale)}</td>
                    <td className="px-4 py-3 text-end text-muted-foreground text-xs">{formatSAR(inv.vat, locale)}</td>
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
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t('subtotal')}</p>
                    <p className="font-medium text-foreground">{formatSAR(inv.subtotal, locale)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('vat')}</p>
                    <p className="font-medium text-foreground">{formatSAR(inv.vat, locale)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('total')}</p>
                    <p className="font-bold text-primary">{formatSAR(inv.total, locale)}</p>
                  </div>
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
