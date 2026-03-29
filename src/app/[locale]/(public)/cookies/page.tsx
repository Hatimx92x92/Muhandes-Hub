// =============================================================================
// Cookie Policy — سياسة ملفات تعريف الارتباط
// =============================================================================

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function CookiesPage() {
  const t = await getTranslations('legal.cookies');

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('whatAreCookies.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('whatAreCookies.description')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('typesWeUse.title')}</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-1">{t('typesWeUse.necessary.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('typesWeUse.necessary.supabaseAuth')}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-1">{t('typesWeUse.preferences.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('typesWeUse.preferences.locale')}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('thirdParty.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('thirdParty.moyasar')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('manage.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('manage.description')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('contact.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('contact.description')}
          </p>
        </section>

        <hr className="border-border" />
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('seeAlso')}</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/privacy" className="text-sm text-primary hover:underline">{t('privacyLink')}</Link>
            <span className="text-border">·</span>
            <Link href="/terms" className="text-sm text-primary hover:underline">{t('termsLink')}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
