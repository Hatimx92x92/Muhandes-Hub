'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerTypesenseReindex } from '@/actions/admin/settings';

export function ReindexButton() {
  const t = useTranslations('admin.settingsPage');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await triggerTypesenseReindex();
      if (result.error) {
        setMessage({ text: result.error, ok: false });
      } else {
        setMessage({ text: t('reindexSuccess', { count: result.data?.synced ?? 0 }), ok: true });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        <RefreshCw className={`h-4 w-4 me-2 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? t('reindexing') : t('reindexNow')}
      </Button>
      {message && (
        <p className={`text-sm ${message.ok ? 'text-success' : 'text-destructive'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
