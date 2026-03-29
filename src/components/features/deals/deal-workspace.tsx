// =============================================================================
// Deal Workspace — Client Component (Enhanced)
// Tabbed workspace with Overview, Milestones, Proofs, Messages, Documents, Activity
// =============================================================================

'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn, formatSAR, formatDate, formatRelativeTime, getLocaleField, getEntitySlug } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { EmptyState } from '@/components/features/empty-state';
import { ProofActions } from '@/components/features/deals/proof-actions';
import { DocumentVault } from '@/components/features/deals/document-vault';
import { DualProgress } from '@/components/features/deals/dual-progress';
import { ActivityFeed } from '@/components/features/deals/activity-feed';
import { DealReviewSection } from '@/components/features/deals/deal-review-section';
import {
  ApproveCancellationButton,
  RejectCancellationButton,
  ApproveSuggestionButton,
  RejectSuggestionButton,
  ApproveSkipButton,
  RejectSkipButton,
} from '@/components/features/deals/deal-actions';
import { CancelRequestForm } from '@/components/forms/cancel-request-form';
import { SkipToFinishForm } from '@/components/forms/skip-milestone-form';
import { DealRealtimeWrapper } from '@/components/features/deals/deal-realtime-wrapper';
import { DealChat } from '@/components/features/deals/deal-chat';
import {
  Handshake, User, Calendar, Banknote, TrendingUp, FileText,
  ListChecks, ShieldCheck, FolderOpen, Activity, MessageSquare,
  Wrench, Truck, Key, CheckCircle, Clock, ArrowRight,
  XCircle, AlertTriangle, BookOpen, LayoutGrid,
  Send, ChevronRight, Info, SkipForward,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PartyProfile {
  [key: string]: unknown;
  full_name: string;
  avatar_url: string | null;
  role: string;
  slug_ar: string | null;
  slug_en: string | null;
}

interface DealDocument {
  id: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  created_at: string;
  uploader: { full_name: string } | null;
}

export interface DealWorkspaceProps {
  deal: Record<string, unknown>;
  userRole: 'buyer' | 'seller';
  userId: string;
  milestones: Array<Record<string, unknown>>;
  suggestions: Array<Record<string, unknown>>;
  proofs: Array<Record<string, unknown>>;
  activities: Array<Record<string, unknown>>;
  pendingCancelRequest: Record<string, unknown> | undefined;
  pendingSkipRequests: Array<Record<string, unknown>>;
  documents: DealDocument[];
  hasReviewed: boolean;
  canReview: boolean;
  daysRemaining: number;
  buyerProfile: PartyProfile | null;
  sellerProfile: PartyProfile | null;
  displaySlug: string;
  initialTab?: string;
  sourceInfo?: { type: string; label: string; href: string } | null;
  contracts?: Array<{ id: string; template_type: string; status: string; created_at: string }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, BadgeProps['variant']> = {
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

const MILESTONE_BV: Record<string, BadgeProps['variant']> = {
  pending: 'secondary',
  in_progress: 'pending',
  completed: 'success',
  skipped: 'info',
};

const MILESTONE_KEYS: Record<string, string> = {
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

const PROOF_BV: Record<string, BadgeProps['variant']> = {
  pending: 'pending',
  confirmed: 'success',
  rejected: 'rejected',
  disputed: 'destructive',
};

const PROOF_ICONS: Record<string, React.ReactNode> = {
  work: <Wrench className="h-4 w-4" />,
  payment: <Banknote className="h-4 w-4" />,
  supply: <Truck className="h-4 w-4" />,
  handover: <Key className="h-4 w-4" />,
};

// Status stepper order
const STEPS = ['active', 'in_progress', 'completed'] as const;
const STEP_KEYS: Record<string, string> = {
  active: 'stepCreated',
  in_progress: 'stepInProgress',
  completed: 'stepCompleted',
};

function getStepIndex(status: string): number {
  if (status === 'completed') return 2;
  if (status === 'in_progress') return 1;
  if (status === 'cancelled' || status === 'disputed') return -1; // special
  return 0;
}

/** Contextual role label based on deal_type */
function getDealRoleKey(dealType: string, party: 'buyer' | 'seller'): string {
  if (dealType === 'deal_project') {
    return party === 'buyer' ? 'roleProjectOwner' : 'roleContractor';
  }
  return party === 'buyer' ? 'roleBuyer' : 'roleSupplier';
}

const ROLE_I18N_KEYS: Record<string, string> = {
  project_owner: 'roleProjectOwner',
  contractor: 'roleContractor',
  supplier: 'roleSupplier',
  buyer: 'roleBuyer',
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DealWorkspace({
  deal,
  userRole,
  userId,
  milestones,
  suggestions,
  proofs,
  activities,
  pendingCancelRequest,
  pendingSkipRequests,
  documents,
  hasReviewed,
  canReview,
  daysRemaining,
  buyerProfile,
  sellerProfile,
  displaySlug,
  initialTab = 'overview',
  sourceInfo,
  contracts = [],
}: DealWorkspaceProps) {
  const t = useTranslations('dashboard.deals');
  const tCommon = useTranslations('dashboard.common');
  const locale = useLocale();

  const status = deal.status as string;
  const isActive = status === 'active' || status === 'in_progress';
  const dealId = deal.id as string;
  const isProject = deal.deal_type === 'deal_project';
  const stepIndex = getStepIndex(status);

  const pendingProofs = proofs.filter(p => p.status === 'pending');
  const confirmedProofs = proofs.filter(p => p.status === 'confirmed');
  const rejectedProofs = proofs.filter(p => p.status === 'rejected');

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showSkipToFinishForm, setShowSkipToFinishForm] = useState(false);
  const hasPendingSkip = pendingSkipRequests.length > 0;

  return (
    <DealRealtimeWrapper dealId={dealId}>
      <div className="space-y-6">
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <FadeIn direction="down" duration={0.4}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground truncate">
                  {(deal.title_slug as string) || `${t('dealPrefix')} #${dealId.slice(0, 8)}`}
                </h1>
                <Badge variant={STATUS_BADGE[status] ?? 'secondary'}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t((STATUS_KEYS[status] ?? status) as any)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t((DEAL_TYPE_KEYS[deal.deal_type as string] ?? deal.deal_type) as any)} · {t((TRIGGER_KEYS[deal.trigger_source as string] ?? deal.trigger_source) as any)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {userRole === 'buyer' ? t('youAreBuyer') : t('youAreSeller')}
              </Badge>
              {isProject && (
                <>
                  <Link href={`/dashboard/deals/${displaySlug}/daily-log`}>
                    <Button variant="outline" size="sm">
                      <BookOpen className="h-4 w-4 me-1.5" />
                      {t('viewDailyLog')}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/deals/${displaySlug}/kanban`}>
                    <Button variant="outline" size="sm">
                      <LayoutGrid className="h-4 w-4 me-1.5" />
                      {t('viewKanban')}
                    </Button>
                  </Link>
                </>
              )}
              {isActive && !pendingCancelRequest && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelForm(v => !v)}
                >
                  <XCircle className="h-4 w-4 me-1.5" />
                  {t('requestCancellation')}
                </Button>
              )}
              {isActive && !hasPendingSkip && (
                <Button
                  size="sm"
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => setShowSkipToFinishForm(v => !v)}
                >
                  <SkipForward className="h-4 w-4 me-1.5" />
                  {t('skipToFinish')}
                </Button>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Inline Cancel Form */}
        {showCancelForm && isActive && !pendingCancelRequest && (
          <FadeIn direction="down" duration={0.3}>
            <Card className="p-5 border-destructive/50">
              <h3 className="text-sm font-semibold text-destructive mb-3">{t('requestCancellation')}</h3>
              <CancelRequestForm dealId={dealId} />
            </Card>
          </FadeIn>
        )}

        {/* Inline Skip-to-Finish Form */}
        {showSkipToFinishForm && isActive && !hasPendingSkip && (
          <FadeIn direction="down" duration={0.3}>
            <Card className="p-5 border-success/50">
              <h3 className="text-sm font-semibold text-success mb-3">{t('skipToFinish')}</h3>
              <SkipToFinishForm dealId={dealId} onCancel={() => setShowSkipToFinishForm(false)} />
            </Card>
          </FadeIn>
        )}

        {/* Pending Skip-to-Finish Requests */}
        {hasPendingSkip && (
          <FadeIn direction="down" duration={0.3}>
            <Card className="border-success/50 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-success flex items-center gap-2">
                <SkipForward className="h-4 w-4" />
                {t('pendingSkipRequests')} ({pendingSkipRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingSkipRequests.map(sr => (
                  <div key={sr.id as string} className="rounded-lg border border-border p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">{sr.reason as string}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('onDate')} {formatDate(sr.created_at as string, locale)}
                    </p>
                    {sr.requester_id !== userId ? (
                      <div className="flex items-center gap-2">
                        <ApproveSkipButton requestId={sr.id as string} />
                        <RejectSkipButton requestId={sr.id as string} />
                      </div>
                    ) : (
                      <Badge variant="pending" className="text-[10px]">
                        {t('awaitingApproval')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* ============================================================== */}
        {/* STATUS STEPPER                                                 */}
        {/* ============================================================== */}
        {status !== 'cancelled' && status !== 'disputed' && (
          <FadeIn direction="up" delay={0.1} duration={0.4}>
            <div className="flex items-center gap-0 overflow-x-auto">
              {STEPS.map((step, idx) => {
                const isCurrent = step === status;
                const isCompleted = stepIndex > idx;
                return (
                  <div key={step} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                          isCompleted
                            ? 'bg-success text-success-foreground'
                            : isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium whitespace-nowrap',
                          isCurrent ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t((STEP_KEYS[step] ?? step) as any)}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'mx-3 h-0.5 w-8 sm:w-12 rounded-full',
                          isCompleted ? 'bg-success' : 'bg-muted',
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </FadeIn>
        )}

        {/* Cancelled / Disputed banner */}
        {(status === 'cancelled' || status === 'disputed') && (
          <Card className={cn(
            'p-4 flex items-center gap-3',
            status === 'cancelled' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5',
          )}>
            {status === 'cancelled' ? (
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            )}
            <div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <p className="text-sm font-semibold">{t((STATUS_KEYS[status] ?? status) as any)}</p>
              <p className="text-xs text-muted-foreground">
                {status === 'cancelled' ? t('stepCancelled') : t('statusDisputed')}
              </p>
            </div>
          </Card>
        )}

        {/* ============================================================== */}
        {/* DUAL PROGRESS                                                  */}
        {/* ============================================================== */}
        <FadeIn direction="up" delay={0.15} duration={0.4}>
          <DualProgress
            sellerProgress={Number(deal.seller_progress) || 0}
            buyerProgress={Number(deal.buyer_progress) || 0}
          />
        </FadeIn>

        {/* ============================================================== */}
        {/* TABS                                                           */}
        {/* ============================================================== */}
        <Tabs defaultValue={initialTab}>
          <TabsList className="w-full overflow-x-auto" variant="default">
            <TabsTrigger value="overview">
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabOverview')}</span>
            </TabsTrigger>
            <TabsTrigger value="milestones">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabMilestones')}</span>
              {milestones.length > 0 && (
                <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 py-0">
                  {milestones.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="proofs">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabProofs')}</span>
              {pendingProofs.length > 0 && (
                <Badge variant="pending" className="ms-1 text-[10px] px-1.5 py-0">
                  {pendingProofs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabMessages')}</span>
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabDocuments')}</span>
              {documents.length > 0 && (
                <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 py-0">
                  {documents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabActivity')}</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* OVERVIEW TAB                                                 */}
          {/* ============================================================ */}
          <TabsContent value="overview">
            <FadeIn direction="up" duration={0.35}>
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main area */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Value + Commission Card */}
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Banknote className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{t('dealValue')}</h3>
                        <p className="text-2xl font-bold text-foreground">{formatSAR(Number(deal.value) || 0)}</p>
                      </div>
                    </div>
                    {Number(deal.commission_rate) > 0 && (
                      <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('commissionRate')}</span>
                          <span className="font-medium">{(Number(deal.commission_rate) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('commissionAmount')}</span>
                          <span>{formatSAR(Number(deal.commission_amount) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('commissionVat')}</span>
                          <span>{formatSAR(Number(deal.commission_vat) || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 font-semibold">
                          <span>{t('totalCommission')}</span>
                          <span>{formatSAR((Number(deal.commission_amount) || 0) + (Number(deal.commission_vat) || 0))}</span>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Summary Card */}
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <h3 className="font-semibold">{t('summary')}</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm text-muted-foreground">{t('milestones')}</span>
                        <span className="text-lg font-bold">{milestones.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm text-muted-foreground">{t('proofs')}</span>
                        <span className="text-lg font-bold">{proofs.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm text-muted-foreground">{t('sellerProgress')}</span>
                        <span className="text-lg font-bold text-primary">{Number(deal.seller_progress) || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm text-muted-foreground">{t('buyerProgress')}</span>
                        <span className="text-lg font-bold text-success">{Number(deal.buyer_progress) || 0}%</span>
                      </div>
                    </div>
                  </Card>

                  {/* Pending Cancel Request */}
                  {pendingCancelRequest && (
                    <Card className="p-5 border-destructive/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-destructive">{t('pendingCancelRequest')}</h3>
                          <p className="text-xs text-muted-foreground">
                            {t('onDate')} {formatDate(pendingCancelRequest.created_at as string, locale)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {pendingCancelRequest.reason as string}
                      </p>
                      {/* Show actions if the current user is NOT the one who requested */}
                      {pendingCancelRequest.requester_id !== userId && (
                        <div className="flex items-center gap-2">
                          <ApproveCancellationButton requestId={pendingCancelRequest.id as string} />
                          <RejectCancellationButton requestId={pendingCancelRequest.id as string} />
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Review Section for completed deals */}
                  {status === 'completed' && (
                    <DealReviewSection
                      dealId={dealId}
                      hasReviewed={hasReviewed}
                      canReview={canReview}
                      daysRemaining={daysRemaining}
                    />
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Deal Info Card */}
                  <Card className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      {t('dealInfo')}
                    </h3>
                    <dl className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{t('dealType')}</dt>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <dd className="font-medium">{t((DEAL_TYPE_KEYS[deal.deal_type as string] ?? deal.deal_type) as any)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{t('triggerSource')}</dt>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <dd className="font-medium">{t((TRIGGER_KEYS[deal.trigger_source as string] ?? deal.trigger_source) as any)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{tCommon('createdAt')}</dt>
                        <dd className="font-medium">{formatDate(deal.created_at as string, locale)}</dd>
                      </div>
                      {!!deal.started_at && (
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">{t('startDate')}</dt>
                          <dd className="font-medium">{formatDate(deal.started_at as string, locale)}</dd>
                        </div>
                      )}
                      {!!deal.completed_at && (
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">{t('completionDate')}</dt>
                          <dd className="font-medium">{formatDate(deal.completed_at as string, locale)}</dd>
                        </div>
                      )}
                    </dl>
                  </Card>

                  {/* Parties Card */}
                  <Card className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t('dealParties')}
                    </h3>
                    <div className="space-y-3">
                      {/* Buyer */}
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Avatar size="default">
                          {buyerProfile?.avatar_url ? (
                            <AvatarImage src={buyerProfile.avatar_url} />
                          ) : null}
                          <AvatarFallback>
                            {buyerProfile
                              ? buyerProfile.full_name.charAt(0)
                              : 'B'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {t(getDealRoleKey(deal.deal_type as string, 'buyer') as any)}
                          </p>
                          {buyerProfile ? (() => {
                            const slug = getEntitySlug(buyerProfile, locale);
                            return slug ? (
                              <Link
                                href={`/partners/${slug}`}
                                className="text-sm font-medium truncate text-primary hover:underline block"
                              >
                                {buyerProfile.full_name}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium truncate">{buyerProfile.full_name}</p>
                            );
                          })() : (
                            <p className="text-sm font-medium truncate">
                              {(deal.buyer_id as string).slice(0, 8)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {userRole === 'buyer' && (
                            <Badge variant="default" className="shrink-0 text-[10px]">{t('you')}</Badge>
                          )}
                          {buyerProfile?.role && ROLE_I18N_KEYS[buyerProfile.role as string] && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {t(ROLE_I18N_KEYS[buyerProfile.role as string] as any)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Seller */}
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Avatar size="default">
                          {sellerProfile?.avatar_url ? (
                            <AvatarImage src={sellerProfile.avatar_url} />
                          ) : null}
                          <AvatarFallback>
                            {sellerProfile
                              ? sellerProfile.full_name.charAt(0)
                              : 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {t(getDealRoleKey(deal.deal_type as string, 'seller') as any)}
                          </p>
                          {sellerProfile ? (() => {
                            const slug = getEntitySlug(sellerProfile, locale);
                            return slug ? (
                              <Link
                                href={`/partners/${slug}`}
                                className="text-sm font-medium truncate text-primary hover:underline block"
                              >
                                {sellerProfile.full_name}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium truncate">{sellerProfile.full_name}</p>
                            );
                          })() : (
                            <p className="text-sm font-medium truncate">
                              {(deal.seller_id as string).slice(0, 8)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {userRole === 'seller' && (
                            <Badge variant="default" className="shrink-0 text-[10px]">{t('you')}</Badge>
                          )}
                          {sellerProfile?.role && ROLE_I18N_KEYS[sellerProfile.role as string] && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {t(ROLE_I18N_KEYS[sellerProfile.role as string] as any)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Quick Links */}
                  {isProject && (
                    <Card className="p-5 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        {t('quickLinks')}
                      </h3>
                      <div className="space-y-2">
                        <Link
                          href={`/dashboard/deals/${displaySlug}/daily-log`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted/50 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {t('viewDailyLog')}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                        </Link>
                        <Link
                          href={`/dashboard/deals/${displaySlug}/kanban`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted/50 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                            {t('viewKanban')}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                        </Link>
                      </div>
                    </Card>
                  )}

                  {/* Deal Origin / Source */}
                  {sourceInfo && (
                    <Card className="p-5 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Send className="h-4 w-4 text-muted-foreground" />
                        {t('dealOrigin')}
                      </h3>
                      <Link
                        href={sourceInfo.href}
                        className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-primary truncate">{sourceInfo.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180 shrink-0" />
                      </Link>
                    </Card>
                  )}

                  {/* Linked Contracts */}
                  {contracts.length > 0 && (
                    <Card className="p-5 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {t('linkedContracts')}
                      </h3>
                      <div className="space-y-2">
                        {contracts.map((c) => (
                          <Link
                            key={c.id}
                            href={`/dashboard/contracts/${c.id}`}
                            className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="text-primary truncate block">{c.template_type}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(c.created_at, locale)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={c.status === 'signed' ? 'success' : c.status === 'draft' ? 'secondary' : 'pending'} className="text-[10px]">
                                {c.status}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </FadeIn>
          </TabsContent>

          {/* ============================================================ */}
          {/* MILESTONES TAB                                               */}
          {/* ============================================================ */}
          <TabsContent value="milestones">
            <FadeIn direction="up" duration={0.35}>
              <div className="space-y-6">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{milestones.length} {t('milestones')}</span>
                    <span className="text-border">·</span>
                    <span>
                      {t('totalPayments')}:{' '}
                      {formatSAR(
                        milestones.reduce((s, m) => s + (Number(m.payment_amount) || 0), 0),
                      )}
                    </span>
                  </div>
                  {userRole === 'buyer' && isActive && (
                    <Link href={`/dashboard/deals/${displaySlug}/milestones/new`}>
                      <Button variant="primary" size="sm">
                        <ListChecks className="h-4 w-4 me-1.5" />
                        {t('addMilestone')}
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Seller suggestions (buyer sees for approval) */}
                {userRole === 'buyer' && suggestions.length > 0 && (
                  <Card className="border-warning/50 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t('sellerSuggestions')} ({suggestions.length})
                    </h3>
                    <StaggerContainer stagger={0.08} className="space-y-3">
                      {suggestions.map(s => (
                        <StaggerItem key={s.id as string}>
                          <div className="rounded-lg border border-border p-4 space-y-3">
                            <div>
                              <p className="font-medium text-sm">{getLocaleField(s, 'title', locale)}</p>
                              {!!s.description_ar && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getLocaleField(s, 'description', locale)}
                                </p>
                              )}
                            </div>
                            {!!s.payment_amount && (
                              <p className="text-xs">
                                {t('amount')}: {formatSAR(Number(s.payment_amount))}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <ApproveSuggestionButton suggestionId={s.id as string} />
                              <RejectSuggestionButton suggestionId={s.id as string} />
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </Card>
                )}

                {/* Seller hint about suggesting */}
                {userRole === 'seller' && isActive && milestones.length > 0 && (
                  <div className="rounded-lg bg-info/5 border border-info/20 p-3 text-xs text-info flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    {t('suggestChangesHint')}
                  </div>
                )}

                {/* Milestone list */}
                {milestones.length === 0 ? (
                  <EmptyState
                    icon={<ListChecks className="h-12 w-12" />}
                    title={t('noMilestones')}
                    description={userRole === 'buyer' && isActive ? t('createMilestonesHint') : undefined}
                    actionLabel={userRole === 'buyer' && isActive ? t('addMilestone') : undefined}
                    actionHref={userRole === 'buyer' && isActive ? `/dashboard/deals/${displaySlug}/milestones/new` : undefined}
                  />
                ) : (
                  <StaggerContainer stagger={0.06} className="space-y-4">
                    {milestones.map((m, idx) => {
                      const ms = m.status as string;
                      const progress = Number(m.progress) || 0;
                      return (
                        <StaggerItem key={m.id as string}>
                          <Card className={cn('p-4', ms === 'in_progress' && 'border-primary/50')}>
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                  ms === 'completed'
                                    ? 'bg-success text-success-foreground'
                                    : ms === 'in_progress'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {ms === 'completed' ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-semibold text-sm">{getLocaleField(m, 'title', locale)}</h4>
                                  <Badge variant={MILESTONE_BV[ms] ?? 'secondary'}>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {t((MILESTONE_KEYS[ms] ?? ms) as any)}
                                  </Badge>
                                </div>
                                {!!m.description_ar && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {getLocaleField(m, 'description', locale)}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {!!m.due_date && (
                                    <span
                                      className={cn(
                                        'flex items-center gap-1',
                                        isDeadlineNear(m.due_date as string) && 'text-warning',
                                        isDeadlinePassed(m.due_date as string) && ms !== 'completed' && 'text-destructive',
                                      )}
                                    >
                                      <Calendar className="h-3.5 w-3.5" />
                                      {formatDate(m.due_date as string, locale)}
                                    </span>
                                  )}
                                  {!!m.payment_amount && Number(m.payment_amount) > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Banknote className="h-3.5 w-3.5" />
                                      {formatSAR(Number(m.payment_amount))}
                                    </span>
                                  )}
                                </div>
                                {progress > 0 && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">{t('sellerProgress')}</span>
                                      <span className="font-medium">{progress}%</span>
                                    </div>
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
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                )}
              </div>
            </FadeIn>
          </TabsContent>

          {/* ============================================================ */}
          {/* PROOFS TAB                                                   */}
          {/* ============================================================ */}
          <TabsContent value="proofs">
            <FadeIn direction="up" duration={0.35}>
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{proofs.length} {t('proofs')}</span>
                    {pendingProofs.length > 0 && (
                      <>
                        <span className="text-border">·</span>
                        <Badge variant="pending" className="text-[10px]">
                          {t('pendingCount', { count: pendingProofs.length })}
                        </Badge>
                      </>
                    )}
                  </div>
                  {isActive && (
                    <Link href={`/dashboard/deals/${displaySlug}/proofs/new`}>
                      <Button variant="primary" size="sm">
                        <Send className="h-4 w-4 me-1.5" />
                        {t('submitProof')}
                      </Button>
                    </Link>
                  )}
                </div>

                {proofs.length === 0 ? (
                  <EmptyState
                    icon={<ShieldCheck className="h-12 w-12" />}
                    title={t('noProofs')}
                    actionLabel={isActive ? t('submitProof') : undefined}
                    actionHref={isActive ? `/dashboard/deals/${displaySlug}/proofs/new` : undefined}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Pending proofs first */}
                    {pendingProofs.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {t('proofGroupPending')} ({pendingProofs.length})
                        </h3>
                        <StaggerContainer stagger={0.06} className="space-y-3">
                          {pendingProofs.map(p => (
                            <StaggerItem key={p.id as string}>
                              <ProofCard proof={p} userId={userId} locale={locale} t={t} deal={deal} buyerProfile={buyerProfile} sellerProfile={sellerProfile} />
                            </StaggerItem>
                          ))}
                        </StaggerContainer>
                      </div>
                    )}

                    {/* Confirmed proofs */}
                    {confirmedProofs.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {t('proofGroupConfirmed')} ({confirmedProofs.length})
                        </h3>
                        <div className="space-y-3">
                          {confirmedProofs.map(p => (
                            <ProofCard key={p.id as string} proof={p} userId={userId} locale={locale} t={t} deal={deal} buyerProfile={buyerProfile} sellerProfile={sellerProfile} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected proofs */}
                    {rejectedProofs.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {t('proofGroupRejected')} ({rejectedProofs.length})
                        </h3>
                        <div className="space-y-3">
                          {rejectedProofs.map(p => (
                            <ProofCard key={p.id as string} proof={p} userId={userId} locale={locale} t={t} deal={deal} buyerProfile={buyerProfile} sellerProfile={sellerProfile} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FadeIn>
          </TabsContent>

          {/* ============================================================ */}
          {/* MESSAGES TAB                                                 */}
          {/* ============================================================ */}
          <TabsContent value="messages">
            <FadeIn direction="up" duration={0.35}>
              <DealChat
                dealId={dealId}
                userId={userId}
                buyerName={buyerProfile?.full_name || 'Buyer'}
                sellerName={sellerProfile?.full_name || 'Seller'}
                buyerId={String(deal.buyer_id || '')}
              />
            </FadeIn>
          </TabsContent>

          {/* ============================================================ */}
          {/* DOCUMENTS TAB                                                */}
          {/* ============================================================ */}
          <TabsContent value="documents">
            <FadeIn direction="up" duration={0.35}>
              <DocumentVault dealId={dealId} documents={documents} />
            </FadeIn>
          </TabsContent>

          {/* ============================================================ */}
          {/* ACTIVITY TAB                                                 */}
          {/* ============================================================ */}
          <TabsContent value="activity">
            <FadeIn direction="up" duration={0.35}>
              <ActivityFeed activities={activities} locale={locale} />
            </FadeIn>
          </TabsContent>
        </Tabs>
      </div>
    </DealRealtimeWrapper>
  );
}

// ---------------------------------------------------------------------------
// Proof Card — sub-component
// ---------------------------------------------------------------------------

function ProofCard({
  proof,
  userId,
  locale,
  t,
  deal,
  buyerProfile,
  sellerProfile,
}: {
  proof: Record<string, unknown>;
  userId: string;
  locale: string;
  deal: Record<string, unknown>;
  buyerProfile: PartyProfile | null;
  sellerProfile: PartyProfile | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const pStatus = proof.status as string;
  const pType = proof.proof_type as string;
  const isSubmitter = proof.submitter_id === userId;

  // Resolve submitter profile
  const submitterProfile = proof.submitter_id === deal.buyer_id ? buyerProfile : sellerProfile;
  const submitterName = submitterProfile
    ? submitterProfile.full_name
    : (proof.submitter_id as string).slice(0, 8);

  return (
    <div className={cn('flex items-end gap-2', isSubmitter ? 'justify-end' : 'justify-start')}>
      {/* Avatar — counterparty side (start) */}
      {!isSubmitter && (
        <Avatar size="sm" className="shrink-0 mb-1">
          {submitterProfile?.avatar_url ? <AvatarImage src={submitterProfile.avatar_url} /> : null}
          <AvatarFallback>{submitterName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      {/* Chat bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl p-4 space-y-2',
          isSubmitter
            ? 'bg-primary/10 border border-primary/20 rounded-ee-sm'
            : 'bg-muted border border-border rounded-es-sm',
        )}
      >
        {/* Sender name */}
        <p className="text-xs font-semibold text-muted-foreground">{submitterName}</p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={PROOF_BV[pStatus] ?? 'secondary'}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t((PROOF_STATUS_KEYS[pStatus] ?? pStatus) as any)}
          </Badge>
          <Badge variant="outline">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t((PROOF_TYPE_KEYS[pType] ?? pType) as any)}
          </Badge>
          {isSubmitter && <Badge variant="info">{t('submittedByYou')}</Badge>}
        </div>

        {/* Description */}
        <p className="text-sm text-foreground">{proof.description as string}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>{t('percentageClaimed')}: {proof.percentage_claim as number}%</span>
          <span>{formatRelativeTime(proof.created_at as string, locale)}</span>
        </div>

        {/* Rejection info */}
        {pStatus === 'rejected' && !!proof.rejection_reason && (
          <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            <span className="font-medium">{t('rejectionReason')}: </span>
            {proof.rejection_reason as string}
            {!!proof.rejection_text && (
              <span> — {proof.rejection_text as string}</span>
            )}
          </div>
        )}

        {/* File attachments */}
        {!!proof.file_urls && Array.isArray(proof.file_urls) && (proof.file_urls as string[]).length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {(proof.file_urls as string[]).length} {t('attachments')}
          </div>
        )}

        {/* Confirm / Reject actions for counterparty */}
        {pStatus === 'pending' && !isSubmitter && (
          <ProofActions proofId={proof.id as string} />
        )}
      </div>

      {/* Avatar — submitter side (end) */}
      {isSubmitter && (
        <Avatar size="sm" className="shrink-0 mb-1">
          {submitterProfile?.avatar_url ? <AvatarImage src={submitterProfile.avatar_url} /> : null}
          <AvatarFallback>{submitterName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDeadlineNear(dateStr: string): boolean {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 7;
}

function isDeadlinePassed(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}
