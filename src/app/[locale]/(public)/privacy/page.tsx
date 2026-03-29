// =============================================================================
// Privacy Policy — سياسة الخصوصية (PDPL compliant)
// =============================================================================

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');

  return (
    <div className="mx-auto max-w-4xl py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

      <div className="space-y-8">
        <section>
          <p className="text-muted-foreground leading-relaxed">
            {t('intro')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('dataCollection.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('dataCollection.item1')}</li>
            <li>{t('dataCollection.item2')}</li>
            <li>{t('dataCollection.item3')}</li>
            <li>{t('dataCollection.item4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('dataUsage.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('dataUsage.item1')}</li>
            <li>{t('dataUsage.item2')}</li>
            <li>{t('dataUsage.item3')}</li>
            <li>{t('dataUsage.item4')}</li>
            <li>{t('dataUsage.item5')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('dataSharing.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            {t('dataSharing.description')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('dataSharing.item1')}</li>
            <li>{t('dataSharing.item2')}</li>
            <li>{t('dataSharing.item3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('rights.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('rights.item1')}</li>
            <li>{t('rights.item2')}</li>
            <li>{t('rights.item3')}</li>
            <li>{t('rights.item4')}</li>
            <li>{t('rights.item5')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('security.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('security.description')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('retention.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('retention.description')}
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
            <Link href="/terms" className="text-sm text-primary hover:underline">{t('termsLink')}</Link>
            <span className="text-border">·</span>
            <Link href="/cookies" className="text-sm text-primary hover:underline">{t('cookiesLink')}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
