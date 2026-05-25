// =============================================================================
// Contract List Page — Dashboard (Created + Received/To-Sign with tab toggle)
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth-guards';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { FileText, Plus, Handshake, CheckCircle } from 'lucide-react';
import { DirectionTabs } from '@/components/features/direction-tabs';
import { ContractsTableClient, type ContractRow } from './contracts-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function ContractsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string; status?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;

  // Role guard — buyer excluded from contracts
  const { user, supabase } = await requireRole(['project_owner', 'contractor', 'supplier']);

  const t = await getTranslations('dashboard.contracts');
  const tCommon = await getTranslations('dashboard.common');

  const activeView = params.view === 'created' || params.view === 'received'
    ? params.view
    : 'created';

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // ---------------------------------------------------------------------------
  // Fetch CREATED contracts (I'm the creator)
  // ---------------------------------------------------------------------------
  let createdQuery = db(supabase)
    .from('contracts')
    .select('*, contract_signatures(id, name, signed_at)', { count: 'exact' })
    .eq('creator_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status && activeView === 'created') {
    createdQuery = createdQuery.eq('status', params.status);
  }

  let createdItems: Array<Record<string, unknown>> = [];
  let createdTotal = 0;
  if (activeView === 'created') {
    const { data, count } = await createdQuery.range((page - 1) * perPage, page * perPage - 1);
    createdItems = (data ?? []) as Array<Record<string, unknown>>;
    createdTotal = count ?? 0;
  }

  // Count for tab
  const { count: createdTabCount } = await db(supabase)
    .from('contracts').select('id', { count: 'exact' })
    .eq('creator_id', user.id);

  // ---------------------------------------------------------------------------
  // Fetch RECEIVED contracts (I signed / need to sign, but didn't create)
  // ---------------------------------------------------------------------------
  const { data: mySignatures } = await db(supabase)
    .from('contract_signatures')
    .select('contract_id, signed_at')
    .eq('user_id', user.id);

  const signedContractIds = (mySignatures ?? []).map((s: { contract_id: string }) => s.contract_id);
  const signedAtMap = new Map(
    (mySignatures ?? []).map((s: { contract_id: string; signed_at: string | null }) => [s.contract_id, s.signed_at]),
  );

  let receivedItems: Array<Record<string, unknown>> = [];
  let receivedTotal = 0;
  if (signedContractIds.length > 0 && activeView === 'received') {
    let recvQuery = db(supabase)
      .from('contracts')
      .select('*, contract_signatures(id, name, signed_at), profiles:creator_id(company_name_ar, company_name_en)', { count: 'exact' })
      .in('id', signedContractIds)
      .neq('creator_id', user.id)
      .order(sortConfig.column, { ascending: sortConfig.ascending });

    if (params.status) {
      recvQuery = recvQuery.eq('status', params.status);
    }

    const { data, count } = await recvQuery.range((page - 1) * perPage, page * perPage - 1);
    receivedItems = (data ?? []) as Array<Record<string, unknown>>;
    receivedTotal = count ?? 0;
  }

  // Count for tab
  let receivedTabCount = 0;
  if (signedContractIds.length > 0) {
    const { count: rc } = await db(supabase)
      .from('contracts').select('id', { count: 'exact' })
      .in('id', signedContractIds)
      .neq('creator_id', user.id);
    receivedTabCount = rc ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Stats for active view
  // ---------------------------------------------------------------------------
  const items = activeView === 'created' ? createdItems : receivedItems;
  const totalCount = activeView === 'created' ? createdTotal : receivedTotal;
  const totalPages = Math.ceil(totalCount / perPage);

  const draftCount = items.filter(c => c.status === 'draft').length;
  const signedCount = items.filter(c => c.status === 'signed').length;

  // Filter groups
  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: [
        { value: 'draft', label: t('status.draft') },
        { value: 'sent', label: t('status.sent') },
        { value: 'signed', label: t('status.signed') },
        { value: 'archived', label: t('status.archived') },
      ],
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          activeView === 'created' ? (
            <Link href="/dashboard/contracts/new">
              <Button variant="primary">
                <Plus className="h-4 w-4 me-2" />
                {t('new')}
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Direction Tabs */}
      <DirectionTabs
        tabs={[
          { key: 'created', label: t('createdTab', { count: createdTabCount ?? 0 }).replace(` (${createdTabCount ?? 0})`, ''), count: createdTabCount ?? 0, href: '/dashboard/contracts?view=created' },
          { key: 'received', label: t('receivedTab', { count: receivedTabCount }).replace(` (${receivedTabCount})`, ''), count: receivedTabCount, href: '/dashboard/contracts?view=received' },
        ]}
        activeTab={activeView}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<FileText className="h-5 w-5 text-muted-foreground" />} label={t('totalContracts')} value={totalCount} />
        <StatCard icon={<Handshake className="h-5 w-5 text-warning" />} label={activeView === 'created' ? t('drafts') : t('pendingSignature')} value={draftCount} color="yellow" />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-success" />} label={t('signedCount')} value={signedCount} color="green" />
      </div>

      {/* Contract Table */}
      <ContractsTableClient
        items={items.map(contract => {
          const sigs = (contract.contract_signatures ?? []) as Array<Record<string, unknown>>;
          const partyA = (contract.party_a ?? {}) as Record<string, unknown>;
          const partyB = (contract.party_b ?? {}) as Record<string, unknown>;
          const creatorProfile = (contract.profiles ?? {}) as Record<string, unknown>;
          const mySigDate = signedAtMap.get(contract.id as string);

          return {
            id: contract.id as string,
            status: contract.status as string,
            template_type: contract.template_type as string,
            party_a_name: (partyA.company_name_ar as string) || (partyA.name as string) || '',
            party_b_name: (partyB.company_name_ar as string) || (partyB.name as string) || '',
            created_at: contract.created_at as string,
            signatures_count: sigs.length,
            deal_id: (contract.deal_id as string) || null,
            i_have_signed: !!mySigDate,
            creator_company: locale === 'ar'
              ? (creatorProfile.company_name_ar as string) || ''
              : ((creatorProfile.company_name_en as string) || (creatorProfile.company_name_ar as string) || ''),
          } satisfies ContractRow;
        })}
        activeView={activeView}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        filterGroups={filterGroups}
        sortOptions={sortOptions}
        translations={{
          colStatus: t('colStatus'),
          colTemplate: t('colTemplate'),
          colParties: t('colParties'),
          colCreated: t('colCreated'),
          colSignatures: t('colSignatures'),
          colDeal: t('colDeal'),
          colYourSignature: t('colYourSignature'),
          partyA: t('partyA'),
          partyB: t('partyB'),
          noContracts: t('noContracts'),
          noContractsDesc: t('noContractsDesc'),
          noReceivedContracts: t('noReceivedContracts'),
          noReceivedContractsDesc: t('noReceivedContractsDesc'),
          createNewContract: t('createNewContract'),
          linkedToDeal: t('linkedToDeal'),
          alreadySigned: t('alreadySigned'),
          awaitingSignature: t('awaitingSignature'),
          creatorName: t('creatorName'),
          status_draft: t('status.draft'),
          status_sent: t('status.sent'),
          status_signed: t('status.signed'),
          status_archived: t('status.archived'),
          template_construction_agreement: t('template.construction_agreement'),
          template_supply_agreement: t('template.supply_agreement'),
          template_custom: t('template.custom'),
        }}
      />
    </div>
  );
}
