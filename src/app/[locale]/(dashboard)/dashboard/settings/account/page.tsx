// =============================================================================
// Settings > Account — danger zone
// =============================================================================

import { getTranslations } from 'next-intl/server';

export default async function AccountSettingsPage() {
  const t = await getTranslations('dashboard.settings');

  return (
    <div className="space-y-6">
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
  );
}
