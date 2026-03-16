// =============================================================================
// Settings Page — user preferences
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.settings');
  const locale = await getLocale();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t('subtitle')}
      </p>

      <div className="space-y-6">
        {/* Notification preferences */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('notificationPreferences')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('notificationPreferencesDesc')}
          </p>
        </div>

        {/* Language preference */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('language')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('languageDesc')}
          </p>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-destructive/30 bg-card p-6">
          <h2 className="text-lg font-semibold text-destructive mb-4">{t('dangerZone')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('dangerZoneDesc')}
          </p>
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-sm font-medium text-destructive opacity-50 cursor-not-allowed"
          >
            {t('deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
