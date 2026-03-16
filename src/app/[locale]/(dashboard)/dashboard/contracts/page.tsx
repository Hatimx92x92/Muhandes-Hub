// =============================================================================
// Contract List Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { FileText, Plus, Handshake, CheckCircle } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { EmptyState } from '@/components/features/empty-state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

const statusBadge: Record<string, BadgeProps['variant']> = {
  draft: 'draft',
  sent: 'pending',
  signed: 'success',
  archived: 'secondary',
};

export default async function ContractsPage() {
  const t = await getTranslations('dashboard.contracts');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: contracts } = await db(supabase)
    .from('contracts')
    .select('*, contract_signatures(id, name, signed_at)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  const items = (contracts ?? []) as Array<Record<string, unknown>>;

  // Stats
  const draftCount = items.filter(c => c.status === 'draft').length;
  const signedCount = items.filter(c => c.status === 'signed').length;
  const totalCount = items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Link href="/dashboard/contracts/new">
          <Button variant="primary">
            <Plus className="h-4 w-4 me-2" />
            {t('new')}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">{t('totalContracts')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Handshake className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-xs text-muted-foreground">{t('drafts')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{signedCount}</p>
              <p className="text-xs text-muted-foreground">{t('signedCount')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contract List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title={t('noContracts')}
          description={t('noContractsDesc')}
          actionLabel={t('createNewContract')}
          actionHref="/dashboard/contracts/new"
        />
      ) : (
        <div className="space-y-4">
          {items.map(contract => {
            const sigs = (contract.contract_signatures ?? []) as Array<Record<string, unknown>>;
            const partyA = (contract.party_a ?? {}) as Record<string, unknown>;
            const partyB = (contract.party_b ?? {}) as Record<string, unknown>;

            return (
              <Link key={contract.id as string} href={`/dashboard/contracts/${contract.id}`}>
                <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusBadge[contract.status as string] ?? 'secondary'}>
                          {t(`status.${contract.status as string}`)}
                        </Badge>
                        <Badge variant="outline">
                          {t(`template.${contract.template_type as string}`)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mt-2">
                        {(partyA.company_name_ar as string) || (partyA.name as string) || t('partyA')}
                        {' ↔ '}
                        {(partyB.company_name_ar as string) || (partyB.name as string) || t('partyB')}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(contract.created_at as string)}</span>
                        <span>{sigs.length}/2 {t('signaturesCount')}</span>
                        {!!contract.deal_id && <span>{t('linkedToDeal')}</span>}
                      </div>
                    </div>
                    <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
