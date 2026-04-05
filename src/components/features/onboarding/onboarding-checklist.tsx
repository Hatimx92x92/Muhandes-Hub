// =============================================================================
// Onboarding Checklist — Client Component
// Role-specific getting-started guide shown on dashboard
// =============================================================================

'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateOnboardingStep, dismissOnboarding } from '@/actions/profile';
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react';
import type { UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Step definitions per role
// ---------------------------------------------------------------------------

interface OnboardingStep {
  key: string;
  href: string;
}

const ROLE_STEPS: Record<UserRole, OnboardingStep[]> = {
  project_owner: [
    { key: 'email', href: '/dashboard' },
    { key: 'profile', href: '/dashboard/profile' },
    { key: 'documents', href: '/dashboard/profile' },
    { key: 'firstProject', href: '/dashboard/projects/new' },
    { key: 'browseContractors', href: '/partners' },
    { key: 'awardDeal', href: '/dashboard/projects' },
  ],
  contractor: [
    { key: 'email', href: '/dashboard' },
    { key: 'profile', href: '/dashboard/profile' },
    { key: 'documents', href: '/dashboard/profile' },
    { key: 'browseProjects', href: '/projects' },
    { key: 'firstBid', href: '/projects' },
    { key: 'setupCrm', href: '/dashboard/crm' },
    { key: 'exploreContracts', href: '/dashboard/contracts' },
  ],
  supplier: [
    { key: 'email', href: '/dashboard' },
    { key: 'profile', href: '/dashboard/profile' },
    { key: 'documents', href: '/dashboard/profile' },
    { key: 'firstProduct', href: '/dashboard/products/new' },
    { key: 'browseRfqs', href: '/dashboard/rfqs' },
    { key: 'firstQuotation', href: '/dashboard/quotations/new' },
    { key: 'setupCrm', href: '/dashboard/crm' },
  ],
  buyer: [
    { key: 'email', href: '/dashboard' },
    { key: 'profile', href: '/dashboard/profile' },
    { key: 'firstRfq', href: '/dashboard/rfqs/new' },
    { key: 'browseMarketplace', href: '/marketplace' },
  ],
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OnboardingChecklistProps {
  role: UserRole;
  progress: Record<string, boolean>;
  emailVerified: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingChecklist({ role, progress, emailVerified }: OnboardingChecklistProps) {
  const t = useTranslations('features.onboarding');
  const [isPending, startTransition] = useTransition();
  const [localProgress, setLocalProgress] = useState<Record<string, boolean>>(() => ({
    ...progress,
    // Email step auto-completes
    ...(emailVerified ? { email: true } : {}),
  }));
  const [dismissed, setDismissed] = useState(progress._dismissed === true);

  const steps = ROLE_STEPS[role] || ROLE_STEPS.buyer;
  const completedCount = steps.filter(s => localProgress[s.key]).length;
  const totalSteps = steps.length;
  const percent = Math.round((completedCount / totalSteps) * 100);

  // Don't show if dismissed or fully complete
  if (dismissed || percent === 100) return null;

  const canDismiss = percent >= 80;

  const handleComplete = (stepKey: string) => {
    if (localProgress[stepKey]) return;

    setLocalProgress(prev => ({ ...prev, [stepKey]: true }));
    startTransition(async () => {
      await updateOnboardingStep(stepKey);
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    startTransition(async () => {
      await dismissOnboarding();
    });
  };

  return (
    <Card className="p-5 space-y-4 border-primary/20 bg-primary/[0.02]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h3 className="font-bold">{t('title')}</h3>
        </div>
        {canDismiss && (
          <Button variant="ghost" size="icon" onClick={handleDismiss} disabled={isPending}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('progress', { percent })}</span>
          <span>{completedCount}/{totalSteps}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step) => {
          const isComplete = localProgress[step.key];
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isComplete
                  ? 'text-muted-foreground'
                  : 'hover:bg-muted/50'
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              {isComplete ? (
                <span className="line-through">{t(`steps.${step.key}`)}</span>
              ) : (
                <Link
                  href={step.href}
                  onClick={() => handleComplete(step.key)}
                  className="flex-1 hover:text-primary transition-colors"
                >
                  {t(`steps.${step.key}`)}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Dismiss hint */}
      {!canDismiss && (
        <p className="text-[11px] text-muted-foreground">
          {t('progress', { percent: 80 })} → {t('dismiss').toLowerCase()}
        </p>
      )}
    </Card>
  );
}
