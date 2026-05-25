// =============================================================================
// Settings > Notifications — notification preferences
// =============================================================================

import { getTranslations } from 'next-intl/server';

export default async function NotificationsSettingsPage() {
  const t = await getTranslations('dashboard.settings');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('notificationPreferences')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('notificationPreferencesDesc')}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('language')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('languageDesc')}
        </p>
      </div>
    </div>
  );
}
