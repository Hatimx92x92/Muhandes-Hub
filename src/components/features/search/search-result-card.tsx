'use client';

import { MapPin, Star, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations, useLocale } from 'next-intl';
import { formatSAR, formatRelativeTime, getLocaleField, cn } from '@/lib/utils';
import type { SearchResult } from '@/actions/search';

interface SearchResultCardProps {
  result: SearchResult;
  collection: 'projects' | 'products' | 'rfqs' | 'partners';
  onClick?: (id: string) => void;
  className?: string;
}

export function SearchResultCard({
  result,
  collection,
  onClick,
  className,
}: SearchResultCardProps) {
  const locale = useLocale();
  const t = useTranslations('features.searchResultCard');

  const title = getLocaleField(
    result as Record<string, unknown>,
    collection === 'partners' ? 'company_name' : 'title',
    locale,
  ) || String(result.full_name || result.title_ar || result.title_en || '');

  const description = getLocaleField(
    result as Record<string, unknown>,
    collection === 'partners' ? 'bio' : 'description',
    locale,
  );

  return (
    <Card
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        className,
      )}
      onClick={() => onClick?.(result.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{title}</h3>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {/* City */}
              {Boolean(result.city) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {String(result.city)}
                </span>
              )}

              {/* Rating */}
              {Boolean(result.average_rating || result.rating) && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {Number(result.average_rating || result.rating).toFixed(1)}
                </span>
              )}

              {/* Price */}
              {Boolean(result.price) && Number(result.price) > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatSAR(Number(result.price), locale)}
                </span>
              )}

              {/* Budget range */}
              {Boolean(result.budget_min) && Number(result.budget_min) > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatSAR(Number(result.budget_min), locale)} –{' '}
                  {formatSAR(Number(result.budget_max || result.budget_min), locale)}
                </span>
              )}

              {/* Date */}
              {Boolean(result.created_at) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeTime(
                    typeof result.created_at === 'number'
                      ? new Date(result.created_at)
                      : String(result.created_at),
                    locale,
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Role badge for partners */}
            {collection === 'partners' && Boolean(result.role) && (
              <Badge variant="outline">{String(result.role)}</Badge>
            )}

            {/* Bid/response count */}
            {(result.bid_count != null && Number(result.bid_count) > 0) && (
              <span className="text-xs text-muted-foreground">
                {Number(result.bid_count)} {t('bids')}
              </span>
            )}
            {(result.response_count != null && Number(result.response_count) > 0) && (
              <span className="text-xs text-muted-foreground">
                {Number(result.response_count)} {t('responses')}
              </span>
            )}

            {/* Category badge */}
            {Boolean(result.category) && (
              <Badge variant="secondary" className="text-xs">
                {String(result.category)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
