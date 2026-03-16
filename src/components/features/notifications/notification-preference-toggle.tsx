// =============================================================================
// Muqawil HUB — Notification Preference Toggle
// =============================================================================

'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateNotificationPreferences } from '@/actions/notifications';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationPreferenceToggleProps {
  notificationType: string;
  label: string;
  emailEnabled: boolean;
  isCritical: boolean;
}

export function NotificationPreferenceToggle({
  notificationType,
  label,
  emailEnabled,
  isCritical,
}: NotificationPreferenceToggleProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('features.notificationPreference');

  const handleToggle = () => {
    if (isCritical) return; // Critical types cannot be muted

    const fd = new FormData();
    fd.set('notification_type', notificationType);
    fd.set('email_enabled', (!emailEnabled).toString());

    startTransition(async () => {
      await updateNotificationPreferences(null, fd);
    });
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">{label}</span>
        {isCritical && (
          <Badge variant="warning" className="text-[10px]">
            {t('critical')}
          </Badge>
        )}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending || isCritical}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          emailEnabled ? 'bg-primary' : 'bg-muted-foreground/30',
          (isPending || isCritical) && 'opacity-50 cursor-not-allowed',
        )}
        title={isCritical ? t('cannotDisable') : undefined}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white transition-transform',
            emailEnabled ? 'translate-x-1.5 rtl:-translate-x-1.5' : 'translate-x-6 rtl:-translate-x-6',
          )}
        />
      </button>
    </div>
  );
}
