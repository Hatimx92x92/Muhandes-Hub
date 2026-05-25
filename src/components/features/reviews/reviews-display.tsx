// =============================================================================
// Muhandes HUB — Reviews Display Component
// Shows a user's reviews on their partner profile page
// =============================================================================

'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { formatRelativeTime } from '@/lib/utils';
import { UserAvatar } from '@/components/features/user-avatar';

interface ReviewData {
  id: string;
  overall_rating: number;
  quality_rating: number | null;
  timeliness_rating: number | null;
  communication_rating: number | null;
  would_recommend: boolean;
  comment_ar: string | null;
  comment_en: string | null;
  created_at: string;
  reviewer: {
    company_name_ar: string | null;
    company_name_en: string | null;
    avatar_url: string | null;
  };
  deal: {
    title_slug: string;
    deal_type: string;
  };
}

interface ReviewsDisplayProps {
  reviews: ReviewData[];
  averageRating: number;
  totalCount: number;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= rating
              ? 'text-warning fill-warning'
              : 'text-zinc-300 dark:text-zinc-600'
          }
        />
      ))}
    </div>
  );
}

function RatingBar({ label, rating }: { label: string; rating: number }) {
  const percentage = (rating / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[80px]">{label}</span>
      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-warning rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-8 text-end">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function ReviewsSummary({ averageRating, totalCount }: { averageRating: number; totalCount: number }) {
  const t = useTranslations('features.reviewsDisplay');

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <Star className="mx-auto mb-2 text-zinc-300" size={32} />
        <p>{t('noReviews')}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div className="text-center">
        <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          {averageRating.toFixed(1)}
        </div>
        <StarRating rating={Math.round(averageRating)} size={14} />
        <p className="text-sm text-zinc-500 mt-1">
          {t('reviewCount', { count: totalCount })}
        </p>
      </div>
    </div>
  );
}

export function ReviewCard({ review }: { review: ReviewData }) {
  const t = useTranslations('features.reviewsDisplay');
  const locale = useLocale();

  const comment = (locale === 'ar' ? review.comment_ar : review.comment_en) || '';
  const reviewerName = (locale === 'ar'
    ? review.reviewer?.company_name_ar
    : review.reviewer?.company_name_en
  ) || t('user');

  const dealTypeLabel = review.deal?.deal_type === 'DEAL-PROJECT'
    ? t('project')
    : t('product');

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={review.reviewer?.avatar_url}
            name={reviewerName}
            size="md"
          />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{reviewerName}</p>
            <p className="text-xs text-zinc-500">{dealTypeLabel}</p>
          </div>
        </div>
        <span className="text-xs text-zinc-400">{formatRelativeTime(review.created_at)}</span>
      </div>

      {/* Overall Rating */}
      <div className="flex items-center gap-2 mb-3">
        <StarRating rating={review.overall_rating} size={18} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {review.overall_rating}/5
        </span>
      </div>

      {/* Sub-ratings */}
      <div className="space-y-1.5 mb-3">
        {review.quality_rating && (
          <RatingBar label={t('quality')} rating={review.quality_rating} />
        )}
        {review.timeliness_rating && (
          <RatingBar label={t('timeliness')} rating={review.timeliness_rating} />
        )}
        {review.communication_rating && (
          <RatingBar label={t('communication')} rating={review.communication_rating} />
        )}
      </div>

      {/* Comment */}
      {comment && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{comment}</p>
      )}

      {/* Recommendation */}
      {review.would_recommend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-success">
          <span>✓</span>
          <span>{t('recommends')}</span>
        </div>
      )}
    </div>
  );
}

export function ReviewsDisplay({ reviews, averageRating, totalCount }: ReviewsDisplayProps) {
  const t = useTranslations('features.reviewsDisplay');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {t('title')}
      </h3>

      <ReviewsSummary averageRating={averageRating} totalCount={totalCount} />

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
