// =============================================================================
// Deal Review Section — Shows review button/form on completed deals
// =============================================================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReviewForm } from '@/components/features/reviews/review-form';
import { Star, CheckCircle } from 'lucide-react';

interface DealReviewSectionProps {
  dealId: string;
  hasReviewed: boolean;
  canReview: boolean;
  daysRemaining: number;
}

export function DealReviewSection({
  dealId,
  hasReviewed,
  canReview,
  daysRemaining,
}: DealReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const t = useTranslations('dashboard.deals');

  if (hasReviewed) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">{t('reviewSubmitted')}</h3>
            <p className="text-sm text-muted-foreground">{t('reviewSubmittedDesc')}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!canReview) return null;

  if (showForm) {
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('writeReview')}</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            {t('cancelReview')}
          </Button>
        </div>
        <ReviewForm dealId={dealId} />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <Star className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">{t('reviewPartner')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('reviewWindowRemaining', { days: daysRemaining })}
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Star className="h-4 w-4" />
          {t('writeReview')}
        </Button>
      </div>
    </Card>
  );
}
