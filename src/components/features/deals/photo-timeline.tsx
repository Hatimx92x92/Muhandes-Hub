// =============================================================================
// Photo Timeline — Client Component for Deal Photo History
// =============================================================================

'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Camera, ImageIcon } from 'lucide-react';
import { getProxyUrl } from '@/lib/file-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelinePhoto {
  url: string;
  date: string;
  source: 'daily_log' | 'proof';
  label?: string;
}

interface PhotoTimelineProps {
  photos: TimelinePhoto[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoTimeline({ photos }: PhotoTimelineProps) {
  const t = useTranslations('dashboard.deals');
  const locale = useLocale();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Camera className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">{t('noPhotos')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('noPhotosDesc')}</p>
      </Card>
    );
  }

  // Group photos by date
  const grouped = photos.reduce<Record<string, TimelinePhoto[]>>((acc, photo) => {
    const dateKey = photo.date.split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(photo);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Photo count */}
      <p className="text-sm text-muted-foreground">
        {t('photosCount', { count: photos.length })}
      </p>

      {/* Timeline */}
      <div className="relative space-y-8">
        {/* Vertical line */}
        <div className="absolute start-3 top-0 bottom-0 w-px bg-border" />

        {sortedDates.map((date) => (
          <div key={date} className="relative ps-10">
            {/* Dot */}
            <div className="absolute start-1 top-1 h-5 w-5 rounded-full border-2 border-primary bg-background flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>

            {/* Date header */}
            <h3 className="font-semibold text-sm mb-3">
              {new Date(date).toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {/* Photo grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {grouped[date].map((photo, idx) => (
                <div key={idx} className="group relative">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(getProxyUrl(photo.url))}
                    className="block w-full aspect-square overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProxyUrl(photo.url)}
                      alt={photo.label || ''}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                  <Badge
                    variant={photo.source === 'proof' ? 'info' : 'default'}
                    className="absolute bottom-1.5 start-1.5 text-[10px]"
                  >
                    {photo.source === 'proof' ? t('fromProof') : t('fromDailyLog')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 end-4 text-white text-2xl font-bold hover:opacity-80 z-10"
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
