// =============================================================================
// Settings Layout — vertical tab navigation for settings sub-pages
// =============================================================================

import { getTranslations } from 'next-intl/server';
import { SettingsNav } from '@/components/features/settings/settings-nav';
import { PageHeader } from '@/components/ui/page-header';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('dashboard.settings');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar tabs */}
        <SettingsNav
          tabs={[
            { href: '/dashboard/settings', label: t('tabs.profile' as never) },
            { href: '/dashboard/settings/notifications', label: t('tabs.notifications' as never) },
            { href: '/dashboard/settings/account', label: t('tabs.account' as never) },
          ]}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
