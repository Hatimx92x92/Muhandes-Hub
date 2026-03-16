'use client';

import { StarRating } from './star-rating';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';

interface ReviewCardProps {
  review: {
    id: string;
    overall_rating: number;
    quality_rating?: number | null;
    timeliness_rating?: number | null;
    communication_rating?: number | null;
    would_recommend: boolean;
    comment_ar?: string | null;
    comment_en?: string | null;
    created_at: string;
    // Reviewer or reviewee info
    reviewer?: { company_name_ar?: string; company_name_en?: string } | null;
    reviewee?: { company_name_ar?: string; company_name_en?: string } | null;
    deal?: { title_ar?: string; title_en?: string } | null;
  };
  direction: 'given' | 'received';
  canEdit?: boolean;
  onEdit?: () => void;
}

export function ReviewCard({ review, direction, canEdit, onEdit }: ReviewCardProps) {
  const t = useTranslations('features.reviewCard');
  const locale = useLocale();
  const otherParty = direction === 'given' ? review.reviewee : review.reviewer;
  const partyName = otherParty?.company_name_ar ?? otherParty?.company_name_en ?? t('unknown');

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{partyName}</p>
            {!!review.deal?.title_ar && (
              <p className="truncate text-sm text-muted-foreground">{review.deal.title_ar}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {review.would_recommend && (
              <Badge variant="success">{t('recommended')}</Badge>
            )}
            <Badge variant="secondary">
              {direction === 'given' ? t('given') : t('received')}
            </Badge>
          </div>
        </div>

        {/* Overall rating */}
        <div className="flex items-center gap-2">
          <StarRating name={`display-${review.id}`} value={review.overall_rating} readonly size="sm" />
          <span className="text-sm font-semibold">{review.overall_rating}/5</span>
        </div>

        {/* Sub-ratings */}
        {(review.quality_rating || review.timeliness_rating || review.communication_rating) && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {!!review.quality_rating && (
              <span>{t('quality')}: {review.quality_rating}/5</span>
            )}
            {!!review.timeliness_rating && (
              <span>{t('timeliness')}: {review.timeliness_rating}/5</span>
            )}
            {!!review.communication_rating && (
              <span>{t('communication')}: {review.communication_rating}/5</span>
            )}
          </div>
        )}

        {/* Comment */}
        {(review.comment_ar || review.comment_en) && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            {review.comment_ar && <p>{review.comment_ar}</p>}
            {review.comment_en && (
              <p className="mt-1 text-muted-foreground" dir="ltr">{review.comment_en}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <time className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString(locale)}
          </time>
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs text-primary hover:underline"
            >
              {t('editReview')}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
