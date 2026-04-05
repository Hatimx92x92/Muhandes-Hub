// =============================================================================
// Muhandes HUB — Notification Preference Toggle
// =============================================================================

'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateNotificationPreferences } from '@/actions/notifications';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

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
      <Switch
        checked={emailEnabled}
        onCheckedChange={handleToggle}
        disabled={isPending || isCritical}
        aria-label={label}
      />
    </div>
  );
}
