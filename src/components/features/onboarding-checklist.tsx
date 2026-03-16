'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { UserRole } from '@/types/enums';

// =============================================================================
// Onboarding Checklist — Role-specific setup steps
// Persistent in dashboard sidebar until all steps complete; dismissible after 80%
// =============================================================================

interface OnboardingStep {
  id: string;
  labelKey: string;
  href: string;
  check: (data: OnboardingData) => boolean;
}

export interface OnboardingData {
  emailVerified: boolean;
  profileComplete: boolean;
  hasLogo: boolean;
  hasDocuments: boolean;         // VAT + CR uploaded
  hasFirstProject: boolean;
  hasFirstProduct: boolean;
  hasFirstBid: boolean;
  hasFirstQuotation: boolean;
  hasFirstRfq: boolean;
  hasFirstCrmClient: boolean;
  hasAwardedDeal: boolean;
  tier: string;
}

function getSteps(role: UserRole, tier: string): OnboardingStep[] {
  const emailStep: OnboardingStep = {
    id: 'email',
    labelKey: 'email',
    href: '/verify/email-sent',
    check: (d) => d.emailVerified,
  };

  const profileStep: OnboardingStep = {
    id: 'profile',
    labelKey: 'profile',
    href: '/dashboard/settings/profile',
    check: (d) => d.profileComplete,
  };

  const docStep: OnboardingStep = {
    id: 'documents',
    labelKey: 'documents',
    href: '/verify/documents',
    check: (d) => d.hasDocuments,
  };

  const isPro = tier !== 'starter';

  switch (role) {
    case 'project_owner':
      return [
        emailStep,
        profileStep,
        {
          id: 'first_project',
          labelKey: 'firstProject',
          href: '/dashboard/projects/new',
          check: (d) => d.hasFirstProject,
        },
        {
          id: 'browse_contractors',
          labelKey: 'browseContractors',
          href: '/partners?role=contractor',
          check: () => false,
        },
        {
          id: 'award_deal',
          labelKey: 'awardDeal',
          href: '/dashboard/bids',
          check: (d) => d.hasAwardedDeal,
        },
      ];

    case 'contractor':
      return [
        emailStep,
        profileStep,
        ...(isPro ? [docStep] : []),
        {
          id: 'browse_projects',
          labelKey: 'browseProjects',
          href: '/projects',
          check: () => false,
        },
        {
          id: 'first_bid',
          labelKey: 'firstBid',
          href: '/projects',
          check: (d) => d.hasFirstBid,
        },
        {
          id: 'setup_crm',
          labelKey: 'setupCrm',
          href: '/dashboard/crm',
          check: (d) => d.hasFirstCrmClient,
        },
        {
          id: 'contracts',
          labelKey: 'exploreContracts',
          href: '/dashboard/contracts/new',
          check: () => false,
        },
      ];

    case 'supplier':
      return [
        emailStep,
        profileStep,
        ...(isPro ? [docStep] : []),
        {
          id: 'first_product',
          labelKey: 'firstProduct',
          href: '/dashboard/products/new',
          check: (d) => d.hasFirstProduct,
        },
        {
          id: 'browse_rfqs',
          labelKey: 'browseRfqs',
          href: '/rfqs',
          check: () => false,
        },
        {
          id: 'first_quotation',
          labelKey: 'firstQuotation',
          href: '/dashboard/quotations',
          check: (d) => d.hasFirstQuotation,
        },
        {
          id: 'setup_crm',
          labelKey: 'setupCrm',
          href: '/dashboard/crm',
          check: (d) => d.hasFirstCrmClient,
        },
      ];

    case 'buyer':
      return [
        emailStep,
        profileStep,
        {
          id: 'first_rfq',
          labelKey: 'firstRfq',
          href: '/dashboard/rfqs/new',
          check: (d) => d.hasFirstRfq,
        },
        {
          id: 'browse_products',
          labelKey: 'browseMarketplace',
          href: '/marketplace',
          check: () => false,
        },
      ];

    default:
      return [emailStep, profileStep];
  }
}

// =============================================================================
// Component
// =============================================================================

interface OnboardingChecklistProps {
  role: UserRole;
  data: OnboardingData;
}

export function OnboardingChecklist({ role, data }: OnboardingChecklistProps) {
  const t = useTranslations('features.onboarding');
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_dismissed');
    if (saved === 'true') setDismissed(true);
  }, []);

  const steps = getSteps(role, data.tier);
  const completed = steps.filter((s) => s.check(data)).length;
  const total = steps.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const canDismiss = progress >= 80;

  if (dismissed || progress === 100) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('onboarding_dismissed', 'true');
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {t('title')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{progress}%</span>
          {canDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
              title={t('dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <ul className="space-y-1.5">
          {steps.map((step) => {
            const done = step.check(data);
            return (
              <li key={step.id}>
                <Link
                  href={done ? '#' : step.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors',
                    done
                      ? 'text-muted-foreground'
                      : 'text-foreground hover:bg-muted/50',
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn(done && 'line-through')}>
                    {t(`steps.${step.labelKey}`)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
