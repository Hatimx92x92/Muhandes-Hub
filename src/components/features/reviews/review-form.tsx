'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { submitReview, editReview } from '@/actions/reviews';
import { StarRating } from './star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Switch } from '@/components/ui/switch';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

interface ReviewFormProps {
  dealId: string;
  /** If provided, this is an edit of an existing review */
  existingReview?: {
    id: string;
    overall_rating: number;
    quality_rating?: number | null;
    timeliness_rating?: number | null;
    communication_rating?: number | null;
    would_recommend: boolean;
    comment_ar?: string | null;
    comment_en?: string | null;
  };
}

export function ReviewForm({ dealId, existingReview }: ReviewFormProps) {
  const isEdit = !!existingReview;
  const action = isEdit ? editReview : submitReview;
  const [state, formAction, isPending] = useActionState<State, FormData>(action, null);
  const t = useTranslations('features.reviewForm');

  const [overallRating, setOverallRating] = useState(existingReview?.overall_rating ?? 0);
  const [qualityRating, setQualityRating] = useState(existingReview?.quality_rating ?? 0);
  const [timelinessRating, setTimelinessRating] = useState(existingReview?.timeliness_rating ?? 0);
  const [communicationRating, setCommunicationRating] = useState(existingReview?.communication_rating ?? 0);
  const [wouldRecommend, setWouldRecommend] = useState(existingReview?.would_recommend ?? true);

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields */}
      {isEdit ? (
        <input type="hidden" name="review_id" value={existingReview.id} />
      ) : (
        <input type="hidden" name="deal_id" value={dealId} />
      )}
      <input type="hidden" name="overall_rating" value={overallRating} />
      <input type="hidden" name="quality_rating" value={qualityRating || ''} />
      <input type="hidden" name="timeliness_rating" value={timelinessRating || ''} />
      <input type="hidden" name="communication_rating" value={communicationRating || ''} />
      <input type="hidden" name="would_recommend" value={String(wouldRecommend)} />

      {/* Error message */}
      {state?.error && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Success message */}
      {state?.data && (
        <AlertBanner variant="success">{isEdit ? t('editSuccess') : t('submitSuccess')}</AlertBanner>
      )}

      {/* Overall Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('overallRating')} *</label>
        <StarRating name="overall_display" value={overallRating} onChange={setOverallRating} size="lg" />
        {overallRating === 0 && (
          <p className="text-xs text-muted-foreground">{t('selectRating')}</p>
        )}
      </div>

      {/* Sub-ratings */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('qualityRating')}</label>
          <StarRating name="quality_display" value={qualityRating} onChange={setQualityRating} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('timelinessRating')}</label>
          <StarRating name="timeliness_display" value={timelinessRating} onChange={setTimelinessRating} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('communicationRating')}</label>
          <StarRating name="communication_display" value={communicationRating} onChange={setCommunicationRating} />
        </div>
      </div>

      {/* Would Recommend */}
      <div className="flex items-center gap-3">
        <Switch
          checked={wouldRecommend}
          onCheckedChange={setWouldRecommend}
        />
        <span className="text-sm font-medium">{t('wouldRecommend')}</span>
      </div>

      {/* Comments */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="comment_ar" className="text-sm font-medium">{t('commentAr')}</label>
          <Textarea
            id="comment_ar"
            name="comment_ar"
            defaultValue={existingReview?.comment_ar ?? ''}
            placeholder={t('commentArPlaceholder')}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="comment_en" className="text-sm font-medium">{t('commentEn')}</label>
          <Textarea
            id="comment_en"
            name="comment_en"
            defaultValue={existingReview?.comment_en ?? ''}
            placeholder={t('commentEnPlaceholder')}
            rows={4}
            dir="ltr"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          disabled={overallRating === 0}
        >
          {isEdit ? t('editReview') : t('submitReview')}
        </Button>
      </div>
    </form>
  );
}
