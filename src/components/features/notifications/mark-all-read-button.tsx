// =============================================================================
// Muqawil HUB — Mark All Read Button
// =============================================================================

'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { markAllNotificationsRead } from '@/actions/notifications';
import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('features.markAllRead');

  const handleClick = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <CheckCheck className="h-4 w-4 me-1.5" />
      {isPending ? t('updating') : t('markAllRead')}
    </Button>
  );
}
