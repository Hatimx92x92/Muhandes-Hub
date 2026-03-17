'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { savePlatformAnnouncement } from '@/actions/admin/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/types';

type State = ActionResult | null;

interface AnnouncementFormProps {
  currentAnnouncement?: {
    message_ar?: string;
    message_en?: string;
    is_active?: boolean;
  };
}

export function AnnouncementForm({ currentAnnouncement }: AnnouncementFormProps) {
  const [state, formAction, isPending] = useActionState<State, FormData>(savePlatformAnnouncement, null);
  const t = useTranslations('admin.settingsPage');

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">{t('announcementAr')}</label>
          <Input
            name="message_ar"
            dir="rtl"
            placeholder={t('announcementArPlaceholder')}
            defaultValue={currentAnnouncement?.message_ar}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">{t('announcementEn')}</label>
          <Input
            name="message_en"
            dir="ltr"
            placeholder={t('announcementEnPlaceholder')}
            defaultValue={currentAnnouncement?.message_en}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={currentAnnouncement?.is_active ?? true}
          className="h-4 w-4 rounded border-border"
        />
        <label className="text-sm">{t('announcementActive')}</label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.data !== undefined && state.error === null && (
        <p className="text-sm text-success">{t('announcementSaved')}</p>
      )}

      <Button type="submit" variant="primary" loading={isPending}>
        {t('saveAnnouncement')}
      </Button>
    </form>
  );
}
