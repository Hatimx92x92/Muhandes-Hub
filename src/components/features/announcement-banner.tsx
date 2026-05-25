'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { X, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnouncementBannerProps {
  message_ar: string;
  message_en: string;
}

export function AnnouncementBanner({ message_ar, message_en }: AnnouncementBannerProps) {
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  const hash = btoa(message_ar + message_en).slice(0, 12);
  const storageKey = `mh_ann_dismissed_${hash}`;

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  const message = locale === 'ar' ? message_ar : message_en;

  function dismiss() {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 border border-info/30 bg-info/5 text-info px-4 py-3 text-sm',
      )}
    >
      <Megaphone className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 hover:bg-info/10 transition-colors"
        aria-label={locale === 'ar' ? 'إغلاق الإعلان' : 'Dismiss announcement'}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
