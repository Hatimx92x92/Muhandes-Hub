// =============================================================================
// Deal Guide — Role-aware "Next Action" panel with prominent CTA
// Displayed between the header and tabs in the deal workspace
// =============================================================================

'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/motion';
import {
  ListChecks,
  Banknote,
  Wrench,
  ClipboardCheck,
  Star,
  XCircle,
  AlertTriangle,
  SkipForward,
  Clock,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DealGuideProps {
  dealStatus: string;
  dealType: string;
  userRole: 'buyer' | 'seller';
  displaySlug: string;
  milestoneCount: number;
  pendingProofsForUser: number;
  pendingSuggestionsForUser: number;
  hasPendingCancel: boolean;
  cancelRequestIsFromCounterparty: boolean;
  hasPendingSkip: boolean;
  skipRequestIsFromCounterparty: boolean;
  hasReviewed: boolean;
  canReview: boolean;
  onSwitchTab?: (tab: string) => void;
}

// ---------------------------------------------------------------------------
// Guide state resolution — priority-ordered
// ---------------------------------------------------------------------------

type GuideAction = {
  key: string;
  variant: 'info' | 'action' | 'warning' | 'urgent' | 'success' | 'muted';
  icon: React.ReactNode;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
  ctaKey?: string;
  ctaHref?: string;
  ctaTab?: string;
};

function resolveGuideAction(props: DealGuideProps): GuideAction {
  const {
    dealStatus,
    userRole,
    displaySlug,
    milestoneCount,
    pendingProofsForUser,
    pendingSuggestionsForUser,
    hasPendingCancel,
    cancelRequestIsFromCounterparty,
    hasPendingSkip,
    skipRequestIsFromCounterparty,
    hasReviewed,
    canReview,
  } = props;

  const isActive = dealStatus === 'active' || dealStatus === 'in_progress';

  // Terminal states
  if (dealStatus === 'cancelled') {
    return {
      key: 'cancelled',
      variant: 'muted',
      icon: <XCircle className="h-6 w-6" />,
      descriptionKey: 'dealCancelled',
    };
  }
  if (dealStatus === 'disputed') {
    return {
      key: 'disputed',
      variant: 'urgent',
      icon: <AlertTriangle className="h-6 w-6" />,
      descriptionKey: 'dealDisputed',
    };
  }

  // Completed states
  if (dealStatus === 'completed') {
    if (canReview && !hasReviewed) {
      return {
        key: 'writeReview',
        variant: 'action',
        icon: <Star className="h-6 w-6" />,
        descriptionKey: 'writeReview',
        ctaKey: 'writeReviewBtn',
        ctaTab: 'overview',
      };
    }
    return {
      key: 'complete',
      variant: 'success',
      icon: <CheckCircle2 className="h-6 w-6" />,
      descriptionKey: hasReviewed ? 'dealCompleteReviewed' : 'dealComplete',
    };
  }

  // --- Active deal: priority-ordered pending items ---

  // 1. Pending cancellation from counterparty
  if (hasPendingCancel && cancelRequestIsFromCounterparty) {
    return {
      key: 'reviewCancel',
      variant: 'urgent',
      icon: <XCircle className="h-6 w-6" />,
      descriptionKey: 'reviewCancellation',
      ctaKey: 'reviewCancellationBtn',
      ctaTab: 'overview',
    };
  }

  // 2. Pending skip request from counterparty
  if (hasPendingSkip && skipRequestIsFromCounterparty) {
    return {
      key: 'reviewSkip',
      variant: 'warning',
      icon: <SkipForward className="h-6 w-6" />,
      descriptionKey: 'reviewSkipRequest',
      ctaKey: 'reviewSkipRequestBtn',
      ctaTab: 'overview',
    };
  }

  // 3. Pending proofs from counterparty to confirm
  if (pendingProofsForUser > 0) {
    return {
      key: 'reviewProofs',
      variant: 'action',
      icon: <ClipboardCheck className="h-6 w-6" />,
      descriptionKey: 'reviewPendingProofs',
      descriptionParams: { count: pendingProofsForUser },
      ctaKey: 'reviewPendingProofsBtn',
      ctaTab: 'proofs',
    };
  }

  // 4. Pending milestone suggestions (buyer only)
  if (userRole === 'buyer' && pendingSuggestionsForUser > 0) {
    return {
      key: 'reviewSuggestions',
      variant: 'warning',
      icon: <Lightbulb className="h-6 w-6" />,
      descriptionKey: 'reviewSuggestions',
      descriptionParams: { count: pendingSuggestionsForUser },
      ctaKey: 'reviewSuggestionsBtn',
      ctaTab: 'milestones',
    };
  }

  // --- Role-specific primary actions ---

  // 5. No milestones yet
  if (isActive && milestoneCount === 0) {
    if (userRole === 'buyer') {
      return {
        key: 'createMilestone',
        variant: 'action',
        icon: <ListChecks className="h-6 w-6" />,
        descriptionKey: 'createFirstMilestone',
        ctaKey: 'createFirstMilestoneBtn',
        ctaHref: `/dashboard/deals/${displaySlug}/milestones/new`,
      };
    }
    return {
      key: 'waitMilestones',
      variant: 'info',
      icon: <Clock className="h-6 w-6" />,
      descriptionKey: 'waitingForMilestones',
    };
  }

  // 6. Has milestones — seller submits progress, buyer submits payment
  if (isActive) {
    if (userRole === 'seller') {
      return {
        key: 'submitProgress',
        variant: 'action',
        icon: <Wrench className="h-6 w-6" />,
        descriptionKey: 'submitProgress',
        ctaKey: 'submitProgressBtn',
        ctaHref: `/dashboard/deals/${displaySlug}/proofs/new?type=work`,
      };
    }
    return {
      key: 'submitPayment',
      variant: 'action',
      icon: <Banknote className="h-6 w-6" />,
      descriptionKey: 'submitPayment',
      ctaKey: 'submitPaymentBtn',
      ctaHref: `/dashboard/deals/${displaySlug}/proofs/new?type=payment`,
    };
  }

  // Fallback (should not reach)
  return {
    key: 'default',
    variant: 'info',
    icon: <Clock className="h-6 w-6" />,
    descriptionKey: 'dealComplete',
  };
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<string, { border: string; bg: string; iconColor: string }> = {
  action: { border: 'border-primary/50', bg: 'bg-primary/5', iconColor: 'text-primary' },
  info: { border: 'border-info/50', bg: 'bg-info/5', iconColor: 'text-info' },
  warning: { border: 'border-warning/50', bg: 'bg-warning/5', iconColor: 'text-warning' },
  urgent: { border: 'border-destructive/50', bg: 'bg-destructive/5', iconColor: 'text-destructive' },
  success: { border: 'border-success/50', bg: 'bg-success/5', iconColor: 'text-success' },
  muted: { border: 'border-border', bg: 'bg-muted/30', iconColor: 'text-muted-foreground' },
};

const CTA_VARIANTS: Record<string, string> = {
  action: 'primary',
  info: 'outline',
  warning: 'outline',
  urgent: 'destructive',
  success: 'outline',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealGuide(props: DealGuideProps) {
  const t = useTranslations('dashboard.deals.guide');
  const tDeals = useTranslations('dashboard.deals');
  const { dealType, userRole, onSwitchTab } = props;

  const action = resolveGuideAction(props);
  const styles = VARIANT_STYLES[action.variant] ?? VARIANT_STYLES.info;

  // Contextual role label
  const roleKey = dealType === 'deal_project'
    ? (userRole === 'buyer' ? 'roleProjectOwner' : 'roleContractor')
    : (userRole === 'buyer' ? 'roleBuyer' : 'roleSupplier');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleName = tDeals(roleKey as any);

  function handleCtaClick() {
    if (action.ctaTab && onSwitchTab) {
      onSwitchTab(action.ctaTab);
    }
  }

  return (
    <FadeIn direction="up" delay={0.08} duration={0.35}>
      <Card className={cn('relative overflow-hidden', styles.border, styles.bg)}>
        {/* Colored left accent stripe */}
        <div className={cn(
          'absolute inset-y-0 start-0 w-1 rounded-s-xl',
          action.variant === 'action' && 'bg-primary',
          action.variant === 'info' && 'bg-info',
          action.variant === 'warning' && 'bg-warning',
          action.variant === 'urgent' && 'bg-destructive',
          action.variant === 'success' && 'bg-success',
          action.variant === 'muted' && 'bg-muted-foreground/30',
        )} />

        <div className="flex flex-col gap-4 p-5 ps-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: icon + text */}
          <div className="flex items-start gap-4 min-w-0">
            <div className={cn('shrink-0 mt-0.5', styles.iconColor)}>
              {action.icon}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('nextStep')}
                </h3>
                <Badge variant="outline" className="text-[10px]">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t('yourRole', { role: roleName } as any)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t(action.descriptionKey as any, action.descriptionParams as any)}
              </p>
            </div>
          </div>

          {/* Right: CTA button */}
          {action.ctaKey && (
            <div className="shrink-0 ps-10 sm:ps-0">
              {action.ctaHref ? (
                <Link href={action.ctaHref}>
                  <Button
                    size="lg"
                    variant={(CTA_VARIANTS[action.variant] ?? 'primary') as 'primary' | 'outline' | 'destructive'}
                    className="w-full sm:w-auto"
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {t(action.ctaKey as any)}
                    <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  variant={(CTA_VARIANTS[action.variant] ?? 'primary') as 'primary' | 'outline' | 'destructive'}
                  className="w-full sm:w-auto"
                  onClick={handleCtaClick}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(action.ctaKey as any)}
                  <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </FadeIn>
  );
}
