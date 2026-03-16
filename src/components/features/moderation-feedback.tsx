// =============================================================================
// Muqawil HUB — Moderation Feedback Display
// =============================================================================

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface ModerationFeedbackProps {
  rejectionReasonAr?: string | null;
  rejectionReasonEn?: string | null;
  className?: string;
}

export function ModerationFeedback({
  rejectionReasonAr,
  rejectionReasonEn,
  className,
}: ModerationFeedbackProps) {
  const t = useTranslations('features.moderation');
  const locale = useLocale();
  const reason = locale === 'ar' ? rejectionReasonAr : rejectionReasonEn;
  const fallback = locale === 'ar' ? rejectionReasonEn : rejectionReasonAr;
  const display = reason || fallback;

  if (!display) return null;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {t('rejectionReason')}
        </p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{display}</p>
      </div>
    </div>
  );
}
