// =============================================================================
// Deal Detail / Workspace Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import {
  Handshake, User, Calendar, Banknote, TrendingUp,
  FileText, ListChecks, ShieldCheck, FolderOpen, Activity,
} from 'lucide-react';
import { formatSAR, formatDate, formatRelativeTime } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { DualProgress } from '@/components/features/deals/dual-progress';
import { ActivityFeed } from '@/components/features/deals/activity-feed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  active: 'info',
  in_progress: 'pending',
  completed: 'success',
  cancelled: 'rejected',
  disputed: 'destructive',
};

const STATUS_KEYS: Record<string, string> = {
  active: 'statusActive',
  in_progress: 'statusInProgress',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
  disputed: 'statusDisputed',
};

const DEAL_TYPE_KEYS: Record<string, string> = {
  deal_project: 'dealTypeProject',
  deal_product: 'dealTypeProduct',
};

const TRIGGER_KEYS: Record<string, string> = {
  bid_award: 'triggerBidAward',
  inquiry_quotation: 'triggerInquiryQuotation',
  rfq_response: 'triggerRfqResponse',
  direct_hire: 'triggerDirectHire',
};

const milestoneStatusBadge: Record<string, BadgeProps['variant']> = {
  pending: 'secondary',
  in_progress: 'pending',
  completed: 'success',
  skipped: 'info',
};

const MILESTONE_STATUS_KEYS: Record<string, string> = {
  pending: 'milestoneStatusPending',
  in_progress: 'milestoneStatusInProgress',
  completed: 'milestoneStatusCompleted',
  skipped: 'milestoneStatusSkipped',
};

const PROOF_TYPE_KEYS: Record<string, string> = {
  payment: 'proofTypePayment',
  work: 'proofTypeWork',
  supply: 'proofTypeSupply',
  handover: 'proofTypeHandover',
};

const PROOF_STATUS_KEYS: Record<string, string> = {
  pending: 'proofStatusPending',
  confirmed: 'proofStatusConfirmed',
  rejected: 'proofStatusRejected',
  disputed: 'proofStatusDisputed',
};

const proofStatusBadge: Record<string, BadgeProps['variant']> = {
  pending: 'pending',
  confirmed: 'success',
  rejected: 'rejected',
  disputed: 'destructive',
};

export default async function DealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');
  const tCommon = await getTranslations('dashboard.common');

  // Fetch deal
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('*')
    .eq('id', id)
    .single();

  if (!deal) notFound();

  // Verify participant
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    redirect('/dashboard/deals');
  }

  const userRole = deal.buyer_id === user.id ? 'buyer' : 'seller';
  const isActive = deal.status === 'active' || deal.status === 'in_progress';

  // Fetch milestones
  const { data: milestones } = await db(supabase)
    .from('deal_milestones')
    .select('*')
    .eq('deal_id', id)
    .order('sort_order', { ascending: true });

  // Fetch proofs
  const { data: proofs } = await db(supabase)
    .from('deal_proofs')
    .select('*')
    .eq('deal_id', id)
    .order('created_at', { ascending: false });

  // Fetch activity log
  const { data: activities } = await db(supabase)
    .from('deal_activity_log')
    .select('*')
    .eq('deal_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch cancel requests
  const { data: cancelRequests } = await db(supabase)
    .from('deal_cancel_requests')
    .select('*')
    .eq('deal_id', id)
    .order('created_at', { ascending: false });

  const milestoneItems = (milestones ?? []) as Array<Record<string, unknown>>;
  const proofItems = (proofs ?? []) as Array<Record<string, unknown>>;
  const activityItems = (activities ?? []) as Array<Record<string, unknown>>;
  const cancelItems = (cancelRequests ?? []) as Array<Record<string, unknown>>;

  // Separate real milestones from suggestions
  const realMilestones = milestoneItems.filter(m => !m.is_suggestion);
  const suggestions = milestoneItems.filter(m => m.is_suggestion && !m.suggestion_approved);

  const pendingCancelRequest = cancelItems.find(r => r.status === 'pending');

  const tabs = [
    { key: 'overview', label: t('tabOverview'), icon: <Handshake className="h-4 w-4" /> },
    { key: 'milestones', label: t('tabMilestones'), icon: <ListChecks className="h-4 w-4" /> },
    { key: 'proofs', label: t('tabProofs'), icon: <ShieldCheck className="h-4 w-4" /> },
    { key: 'documents', label: t('tabDocuments'), icon: <FolderOpen className="h-4 w-4" /> },
    { key: 'activity', label: t('tabActivity'), icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {deal.title_slug || `${t('dealPrefix')} #${deal.id.slice(0, 8)}`}
            </h1>
            <Badge variant={statusBadge[deal.status] ?? 'secondary'}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {t((STATUS_KEYS[deal.status] ?? deal.status) as any)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t((DEAL_TYPE_KEYS[deal.deal_type] ?? deal.deal_type) as any)} · {t((TRIGGER_KEYS[deal.trigger_source] ?? deal.trigger_source) as any)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole === 'buyer' ? t('youAreBuyer') : t('youAreSeller')}
          </Badge>
          <Link href="/dashboard/deals">
            <Button variant="outline" size="sm">{t('backToList')}</Button>
          </Link>
        </div>
      </div>

      {/* Dual Progress */}
      <DualProgress
        sellerProgress={Number(deal.seller_progress) || 0}
        buyerProgress={Number(deal.buyer_progress) || 0}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {tabs.map(tabItem => (
          <Link
            key={tabItem.key}
            href={`/dashboard/deals/${id}?tab=${tabItem.key}`}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === tabItem.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tabItem.icon}
            {tabItem.label}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <OverviewTab
          deal={deal}
          userRole={userRole}
          milestonesCount={realMilestones.length}
          proofsCount={proofItems.length}
          pendingCancelRequest={pendingCancelRequest}
        />
      )}
      {tab === 'milestones' && (
        <MilestonesTab
          dealId={id}
          milestones={realMilestones}
          suggestions={suggestions}
          userRole={userRole}
          isActive={isActive}
        />
      )}
      {tab === 'proofs' && (
        <ProofsTab
          dealId={id}
          proofs={proofItems}
          userRole={userRole}
          userId={user.id}
          isActive={isActive}
        />
      )}
      {tab === 'documents' && (
        <DocumentsTab dealId={id} />
      )}
      {tab === 'activity' && (
        <ActivityFeed activities={activityItems} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OVERVIEW TAB
// ---------------------------------------------------------------------------
async function OverviewTab({
  deal,
  userRole,
  milestonesCount,
  proofsCount,
  pendingCancelRequest,
}: {
  deal: Record<string, unknown>;
  userRole: 'buyer' | 'seller';
  milestonesCount: number;
  proofsCount: number;
  pendingCancelRequest: Record<string, unknown> | undefined;
}) {
  const t = await getTranslations('dashboard.deals');
  const tCommon = await getTranslations('dashboard.common');

  const value = Number(deal.value) || 0;
  const commissionRate = Number(deal.commission_rate) || 0;
  const commissionAmount = Number(deal.commission_amount) || 0;
  const commissionVat = Number(deal.commission_vat) || 0;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Deal Value */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold">{t('dealValue')}</h3>
        </div>
        <p className="text-2xl font-bold text-foreground">{formatSAR(value)}</p>
        {commissionRate > 0 && (
          <div className="mt-3 space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('commissionRate')}</span>
              <span>{(commissionRate * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('commissionAmount')}</span>
              <span>{formatSAR(commissionAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('commissionVat')}</span>
              <span>{formatSAR(commissionVat)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span>{t('totalCommission')}</span>
              <span>{formatSAR(commissionAmount + commissionVat)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Timeline */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
            <Calendar className="h-5 w-5 text-info" />
          </div>
          <h3 className="font-semibold">{tCommon('dates')}</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tCommon('createdAt')}</span>
            <span>{formatDate(deal.created_at as string)}</span>
          </div>
          {!!deal.started_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('startDate')}</span>
              <span>{formatDate(deal.started_at as string)}</span>
            </div>
          )}
          {!!deal.completed_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('completionDate')}</span>
              <span>{formatDate(deal.completed_at as string)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <h3 className="font-semibold">{t('summary')}</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('milestones')}</span>
            <span className="font-medium">{milestonesCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('proofs')}</span>
            <span className="font-medium">{proofsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('sellerProgress')}</span>
            <span className="font-medium">{Number(deal.seller_progress) || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('buyerProgress')}</span>
            <span className="font-medium">{Number(deal.buyer_progress) || 0}%</span>
          </div>
        </div>
      </Card>

      {/* Parties */}
      <Card className="p-5 sm:col-span-2 lg:col-span-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">{t('dealParties')}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('buyer')}</p>
            <p className="font-medium text-sm">{deal.buyer_id as string}</p>
            {userRole === 'buyer' && (
              <Badge variant="default" className="mt-2">{t('you')}</Badge>
            )}
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('seller')}</p>
            <p className="font-medium text-sm">{deal.seller_id as string}</p>
            {userRole === 'seller' && (
              <Badge variant="default" className="mt-2">{t('you')}</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Pending Cancel Request */}
      {pendingCancelRequest && (
        <Card className="p-5 border-destructive sm:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="destructive">{t('pendingCancelRequest')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {pendingCancelRequest.reason as string}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('onDate')} {formatDate(pendingCancelRequest.created_at as string)}
          </p>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MILESTONES TAB
// ---------------------------------------------------------------------------
async function MilestonesTab({
  dealId,
  milestones,
  suggestions,
  userRole,
  isActive,
}: {
  dealId: string;
  milestones: Array<Record<string, unknown>>;
  suggestions: Array<Record<string, unknown>>;
  userRole: 'buyer' | 'seller';
  isActive: boolean;
}) {
  const t = await getTranslations('dashboard.deals');

  const totalPayments = milestones.reduce(
    (sum, m) => sum + (Number(m.payment_amount) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Add milestone button (buyer only) */}
      {userRole === 'buyer' && isActive && (
        <div className="flex justify-end">
          <Link href={`/dashboard/deals/${dealId}/milestones/new`}>
            <Button variant="primary">+ {t('addMilestone')}</Button>
          </Link>
        </div>
      )}

      {/* Milestone summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{milestones.length} {t('milestones')}</span>
        <span>·</span>
        <span>{t('totalPayments')}: {formatSAR(totalPayments)}</span>
      </div>

      {/* Suggestions (buyer sees for approval) */}
      {userRole === 'buyer' && suggestions.length > 0 && (
        <Card className="border-warning p-4">
          <h3 className="font-semibold text-warning mb-3">
            {t('sellerSuggestions')} ({suggestions.length})
          </h3>
          <div className="space-y-3">
            {suggestions.map(s => (
              <div key={s.id as string} className="rounded-lg border border-border p-3">
                <p className="font-medium text-sm">{s.title_ar as string}</p>
                {!!s.description_ar && (
                  <p className="text-xs text-muted-foreground mt-1">{s.description_ar as string}</p>
                )}
                {!!s.payment_amount && (
                  <p className="text-xs mt-1">{t('amount')}: {formatSAR(Number(s.payment_amount))}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Milestone Timeline */}
      {milestones.length === 0 ? (
        <Card className="p-8 text-center">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t('noMilestones')}</p>
          {userRole === 'buyer' && isActive && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('createMilestonesHint')}
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {milestones.map((m, idx) => (
            <MilestoneCard
              key={m.id as string}
              milestone={m}
              index={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function MilestoneCard({
  milestone,
  index,
}: {
  milestone: Record<string, unknown>;
  index: number;
}) {
  const t = await getTranslations('dashboard.deals');

  const status = milestone.status as string;
  const progress = Number(milestone.progress) || 0;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Number circle */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
          status === 'completed' ? 'bg-success text-success-foreground' :
          status === 'in_progress' ? 'bg-primary text-primary-foreground' :
          'bg-muted text-muted-foreground'
        }`}>
          {index}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm">{milestone.title_ar as string}</h4>
            <Badge variant={milestoneStatusBadge[status] ?? 'secondary'}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {t((MILESTONE_STATUS_KEYS[status] ?? status) as any)}
            </Badge>
          </div>

          {!!milestone.description_ar && (
            <p className="text-xs text-muted-foreground mt-1">{milestone.description_ar as string}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
            {!!milestone.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(milestone.due_date as string)}
              </span>
            )}
            {!!milestone.payment_amount && Number(milestone.payment_amount) > 0 && (
              <span className="flex items-center gap-1">
                <Banknote className="h-3.5 w-3.5" />
                {formatSAR(Number(milestone.payment_amount))}
              </span>
            )}
          </div>

          {/* Progress indicator */}
          {progress > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PROOFS TAB
// ---------------------------------------------------------------------------
async function ProofsTab({
  dealId,
  proofs,
  userRole,
  userId,
  isActive,
}: {
  dealId: string;
  proofs: Array<Record<string, unknown>>;
  userRole: 'buyer' | 'seller';
  userId: string;
  isActive: boolean;
}) {
  const t = await getTranslations('dashboard.deals');
  return (
    <div className="space-y-6">
      {/* Submit proof button */}
      {isActive && (
        <div className="flex justify-end">
          <Link href={`/dashboard/deals/${dealId}/proofs/new`}>
            <Button variant="primary">+ {t('submitProof')}</Button>
          </Link>
        </div>
      )}

      {proofs.length === 0 ? (
        <Card className="p-8 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t('noProofs')}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {proofs.map(p => (
            <ProofCard
              key={p.id as string}
              proof={p}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function ProofCard({
  proof,
  userId,
}: {
  proof: Record<string, unknown>;
  userId: string;
}) {
  const t = await getTranslations('dashboard.deals');

  const status = proof.status as string;
  const isSubmitter = proof.submitter_id === userId;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={proofStatusBadge[status] ?? 'secondary'}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {t((PROOF_STATUS_KEYS[status] ?? status) as any)}
            </Badge>
            <Badge variant="outline">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {t((PROOF_TYPE_KEYS[proof.proof_type as string] ?? proof.proof_type) as any)}
            </Badge>
            {isSubmitter && <Badge variant="info">{t('submittedByYou')}</Badge>}
          </div>

          <p className="text-sm text-foreground">{proof.description as string}</p>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{t('percentageClaimed')}: {proof.percentage_claim as number}%</span>
            <span>{formatRelativeTime(proof.created_at as string)}</span>
          </div>

          {/* Rejection info */}
          {status === 'rejected' && !!proof.rejection_reason && (
            <div className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              <span className="font-medium">{t('rejectionReason')}: </span>
              {proof.rejection_reason as string}
              {!!proof.rejection_text && (
                <span> — {proof.rejection_text as string}</span>
              )}
            </div>
          )}

          {/* File attachments count */}
          {!!proof.file_urls && Array.isArray(proof.file_urls) && (proof.file_urls as string[]).length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              {(proof.file_urls as string[]).length} {t('attachments')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DOCUMENTS TAB (placeholder — file upload requires Supabase Storage)
// ---------------------------------------------------------------------------
async function DocumentsTab({ dealId }: { dealId: string }) {
  const t = await getTranslations('dashboard.deals');

  return (
    <Card className="p-8 text-center">
      <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
      <p className="text-muted-foreground">{t('documentVault')}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {t('documentVaultDesc')}
      </p>
    </Card>
  );
}
