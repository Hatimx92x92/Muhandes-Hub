'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Star, User, Handshake, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { LocaleDate } from '@/components/ui/locale-date';
import { Link } from '@/i18n/navigation';
import type { AdminReviewRow } from '@/actions/admin/queries';

function RatingStars({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < value ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="ms-1 text-sm font-medium">{value}/{max}</span>
    </div>
  );
}

interface ReviewDetailModalProps {
  review: AdminReviewRow;
  translations: Record<string, string>;
}

export function ReviewDetailModal({ review: r, translations: t }: ReviewDetailModalProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Eye className="me-1 h-3.5 w-3.5" />
            {t['viewDetails'] ?? 'View'}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t['reviewDetail']}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status + Overall Rating */}
          <div className="flex items-center justify-between">
            <RatingStars value={r.overall_rating} />
            <Badge variant={r.is_hidden ? 'destructive' : 'success'}>
              {r.is_hidden ? t['visibility_hidden'] : t['visibility_visible']}
            </Badge>
          </div>

          {/* Sub-Ratings */}
          {(r.quality_rating != null || r.timeliness_rating != null || r.communication_rating != null) && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h4 className="text-sm font-semibold">{t['subRatings']}</h4>
              <div className="space-y-2">
                {r.quality_rating != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t['qualityRating']}</span>
                    <RatingStars value={r.quality_rating} />
                  </div>
                )}
                {r.timeliness_rating != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t['timelinessRating']}</span>
                    <RatingStars value={r.timeliness_rating} />
                  </div>
                )}
                {r.communication_rating != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t['communicationRating']}</span>
                    <RatingStars value={r.communication_rating} />
                  </div>
                )}
              </div>
              {r.would_recommend != null && (
                <div className="flex items-center gap-2 border-t border-border pt-2">
                  {r.would_recommend ? (
                    <ThumbsUp className="h-4 w-4 text-success" />
                  ) : (
                    <ThumbsDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">
                    {r.would_recommend ? t['wouldRecommend'] : t['wouldNotRecommend']}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Full Comment */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-semibold">{t['col_comment']}</h4>
            {r.comment_ar && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t['arabic'] ?? 'Arabic'}</p>
                <p dir="rtl" className="whitespace-pre-wrap text-sm">{r.comment_ar}</p>
              </div>
            )}
            {r.comment_en && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t['english'] ?? 'English'}</p>
                <p dir="ltr" className="whitespace-pre-wrap text-sm">{r.comment_en}</p>
              </div>
            )}
            {!r.comment_ar && !r.comment_en && (
              <p className="text-sm text-muted-foreground">{t['noComment'] ?? 'No comment provided'}</p>
            )}
          </div>

          {/* Reviewer & Reviewee */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {t['reviewer']}
              </h4>
              <p className="text-sm font-medium">{r.reviewer_name ?? '—'}</p>
              {r.reviewer_company && (
                <p className="text-xs text-muted-foreground">{r.reviewer_company}</p>
              )}
              <Link
                href={`/admin/users/${r.reviewer_id}` as '/admin/users/[id]'}
                className="text-xs text-primary hover:underline"
              >
                {t['viewProfile']} →
              </Link>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {t['reviewee']}
              </h4>
              <p className="text-sm font-medium">{r.reviewee_name ?? '—'}</p>
              {r.reviewee_company && (
                <p className="text-xs text-muted-foreground">{r.reviewee_company}</p>
              )}
              <Link
                href={`/admin/users/${r.reviewee_id}` as '/admin/users/[id]'}
                className="text-xs text-primary hover:underline"
              >
                {t['viewProfile']} →
              </Link>
            </div>
          </div>

          {/* Deal Info */}
          <div className="rounded-lg border border-border p-3 space-y-1">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Handshake className="h-3.5 w-3.5" />
              {t['relatedDeal']}
            </h4>
            <div className="flex items-center gap-3 text-sm">
              {r.deal_type && <Badge variant="secondary">{r.deal_type}</Badge>}
              {r.deal_value != null && <span>{formatSAR(r.deal_value)}</span>}
            </div>
            <Link
              href={`/admin/deals/${r.deal_id}` as '/admin/deals/[id]'}
              className="text-xs text-primary hover:underline"
            >
              {t['viewDeal']} →
            </Link>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {t['col_created']}: <LocaleDate date={r.created_at} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
