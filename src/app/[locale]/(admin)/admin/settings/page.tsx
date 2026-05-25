import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Tag, Megaphone, Search } from 'lucide-react';
import { SettingsForm } from '@/components/features/admin/settings-form';
import { CouponForm } from '@/components/features/admin/coupon-form';
import { AnnouncementForm } from '@/components/features/admin/announcement-form';
import { ReindexButton } from '@/components/features/admin/reindex-button';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch platform settings and coupons in parallel
  const [
    { data: settings },
    { data: coupons },
  ] = await Promise.all([
    db(supabase).from('platform_settings').select('key, value, updated_at').order('key'),
    db(supabase).from('coupons').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('settingsPage.title')}</h1>
        <p className="text-muted-foreground">{t('settingsPage.subtitle')}</p>
      </div>

      {/* Platform Settings */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Settings className="h-5 w-5" />
          {t('settingsPage.platformSettings')}
        </h2>

        {/* Current settings */}
        {settings && (settings as Record<string, unknown>[]).length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(settings as Record<string, unknown>[]).map((setting) => (
              <Card key={setting.key as string}>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium">{setting.key as string}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof setting.value === 'object'
                      ? JSON.stringify(setting.value)
                      : String(setting.value ?? '')}
                  </p>
                  {!!setting.updated_at && (
                    <time className="text-xs text-muted-foreground">
                      {t('settingsPage.lastUpdated')} {new Date(setting.updated_at as string).toLocaleDateString(locale)}
                    </time>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Update setting form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settingsPage.addUpdateSetting')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm />
          </CardContent>
        </Card>
      </section>

      {/* Coupons */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Tag className="h-5 w-5" />
          {t('settingsPage.couponManagement')}
        </h2>

        {/* Existing coupons */}
        {coupons && (coupons as Record<string, unknown>[]).length > 0 && (
          <div className="space-y-3">
            {(coupons as Record<string, unknown>[]).map((coupon) => (
              <Card key={coupon.id as string}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-sm font-bold">{coupon.code as string}</p>
                      <p className="text-sm text-muted-foreground">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : `${Number(coupon.discount_value ?? 0).toLocaleString(locale)} ${t('sar')}`}
                        {` ${t('settingsPage.discount')}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {coupon.valid_from ? new Date(coupon.valid_from as string).toLocaleDateString(locale) : ''}
                        {' – '}
                        {coupon.valid_to ? new Date(coupon.valid_to as string).toLocaleDateString(locale) : ''}
                      </p>
                      {!!coupon.usage_limit && (
                        <p className="text-xs text-muted-foreground">
                          {t('settingsPage.usages')} {String(coupon.usage_count ?? 0)} / {String(coupon.usage_limit)}
                        </p>
                      )}
                    </div>
                    <Badge variant={coupon.is_active ? 'active' : 'secondary'}>
                      {coupon.is_active ? t('settingsPage.activeCoupon') : t('settingsPage.inactiveCoupon')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add coupon form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settingsPage.addNewCoupon')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CouponForm />
          </CardContent>
        </Card>
      </section>

      {/* Announcements */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Megaphone className="h-5 w-5" />
          {t('settingsPage.announcements')}
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settingsPage.platformAnnouncement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementForm
              currentAnnouncement={
                (settings as Record<string, unknown>[])?.find(
                  (s) => s.key === 'announcement',
                )?.value as { message_ar?: string; message_en?: string; is_active?: boolean } | undefined
              }
            />
          </CardContent>
        </Card>
      </section>

      {/* Search Index */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Search className="h-5 w-5" />
          {t('settingsPage.searchIndex')}
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settingsPage.reindexTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('settingsPage.reindexDesc')}</p>
          </CardHeader>
          <CardContent>
            <ReindexButton />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
