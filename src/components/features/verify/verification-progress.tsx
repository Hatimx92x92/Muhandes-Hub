'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

// =============================================================================
// VerificationProgress — horizontal step indicator for onboarding gates
// =============================================================================

export interface VerifyStep {
  key: string;
  label: string;
}

interface VerificationProgressProps {
  steps: VerifyStep[];
  currentIndex: number; // 0-based index of the active step
}

export function VerificationProgress({ steps, currentIndex }: VerificationProgressProps) {
  if (steps.length <= 1) return null; // No stepper for single-gate flows

  return (
    <nav aria-label="Verification progress" className="mb-6">
      <ol className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isUpcoming = i > currentIndex;

          return (
            <li
              key={step.key}
              className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}
            >
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    isUpcoming && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium leading-tight text-center max-w-16 sm:max-w-20',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-foreground',
                    isUpcoming && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-1.5 mt-[-18px] h-0.5 flex-1 rounded-full sm:mx-2',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
