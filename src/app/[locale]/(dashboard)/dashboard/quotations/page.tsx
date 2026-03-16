// =============================================================================
// Quotation List Page — Dashboard
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Receipt, Plus, User, Calendar, Banknote } from 'lucide-react';
import { formatSAR, formatDate } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  draft: 'draft',
  sent: 'pending',
  viewed: 'info',
  accepted: 'success',
  rejected: 'rejected',
  expired: 'secondary',
};

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.quotations');
  const tCommon = await getTranslations('dashboard.common');

  // Check role — contractor or supplier can send quotations; everyone can receive
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  const canCreate = role === 'contractor' || role === 'supplier';

  // Fetch sent quotations
  let sentQuery = db(supabase)
    .from('quotations')
    .select('id, number, mode, recipient_id, client_name, subtotal, vat_amount, total, validity_days, status, created_at')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  if (params.status) {
    sentQuery = sentQuery.eq('status', params.status);
  }

  const { data: sentQuotations } = await sentQuery.limit(100);

  // Fetch received quotations
  const { data: receivedQuotations } = await db(supabase)
    .from('quotations')
    .select('id, number, mode, sender_id, client_name, subtotal, vat_amount, total, validity_days, status, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const sentItems = (sentQuotations ?? []) as Array<{
    id: string;
    number: string;
    mode: string;
    recipient_id: string | null;
    client_name: string | null;
    subtotal: number;
    vat_amount: number;
    total: number;
    validity_days: number;
    status: string;
    created_at: string;
  }>;

  const receivedItems = (receivedQuotations ?? []) as Array<{
    id: string;
    number: string;
    mode: string;
    sender_id: string;
    client_name: string | null;
    subtotal: number;
    vat_amount: number;
    total: number;
    validity_days: number;
    status: string;
    created_at: string;
  }>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/quotations/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t('new')}
          </Link>
        )}
      </div>

      {/* Status filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/dashboard/quotations"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            !params.status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {tCommon('all')}
        </Link>
        {(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'] as const).map((key) => (
          <Link
            key={key}
            href={`/dashboard/quotations?status=${key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              params.status === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {key === 'sent' ? t('sent') : key === 'accepted' ? t('accepted') : key === 'expired' ? t('expired') : key === 'viewed' ? tCommon('viewed') : tCommon(key as 'draft' | 'rejected')}
          </Link>
        ))}
      </div>

      {/* Sent Quotations */}
      {canCreate && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t('sentQuotations')} ({sentItems.length})
          </h2>
          {sentItems.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title={t('noSentQuotations')}
              description={t('noSentQuotationsDesc')}
            />
          ) : (
            <div className="space-y-3">
              {sentItems.map((q) => (
                <QuotationCard key={q.id} quotation={q} direction="sent" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Received Quotations */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t('receivedQuotations')} ({receivedItems.length})
        </h2>
        {receivedItems.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-12 w-12" />}
            title={t('noReceivedQuotations')}
            description={t('noReceivedQuotationsDesc')}
          />
        ) : (
          <div className="space-y-3">
            {receivedItems.map((q) => (
              <QuotationCard key={q.id} quotation={q} direction="received" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quotation Card
// ---------------------------------------------------------------------------
async function QuotationCard({
  quotation,
  direction,
}: {
  quotation: {
    id: string;
    number: string;
    mode: string;
    client_name: string | null;
    total: number;
    status: string;
    created_at: string;
  };
  direction: 'sent' | 'received';
}) {
  const t = await getTranslations('dashboard.quotations');
  const tCommon = await getTranslations('dashboard.common');

  const getStatusLabel = (status: string) => {
    if (status === 'sent') return t('sent');
    if (status === 'accepted') return t('accepted');
    if (status === 'expired') return t('expired');
    if (status === 'viewed') return tCommon('viewed');
    return tCommon(status as 'draft' | 'rejected');
  };

  const getModeLabel = (mode: string) => {
    if (mode === 'inquiry_response') return t('modeInquiryResponse');
    if (mode === 'standalone') return t('modeStandalone');
    return mode;
  };

  return (
    <Link href={`/dashboard/quotations/${quotation.id}`}>
      <Card className="p-4 transition-colors hover:bg-card/80">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">
                {quotation.number}
              </span>
              <Badge variant={statusBadge[quotation.status] || 'secondary'}>
                {getStatusLabel(quotation.status)}
              </Badge>
              <Badge variant="outline">
                {getModeLabel(quotation.mode)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {quotation.client_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {quotation.client_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(quotation.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                {formatSAR(quotation.total)}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {direction === 'sent' ? t('sentDirection') : t('receivedDirection')}
          </div>
        </div>
      </Card>
    </Link>
  );
}
