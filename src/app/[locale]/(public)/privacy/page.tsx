// =============================================================================
// Privacy Policy — سياسة الخصوصية (PDPL compliant)
// =============================================================================

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

// ---------------------------------------------------------------------------
// SEO — generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('metadata.privacy');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      siteName: 'Muhandes HUB',
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/privacy`,
      languages: {
        ar: `${BASE_URL}/ar/privacy`,
        en: `${BASE_URL}/en/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal.privacy');

  return (
    <div className="mx-auto max-w-4xl py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

      <div className="space-y-8">
        <section>
          <p className="text-muted-foreground leading-relaxed">{t('intro')}</p>
        </section>

        {/* 1. Information We Collect */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('dataCollection.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">{t('dataCollection.description')}</p>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataCollection.personal.title')}</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
            <li>{t('dataCollection.personal.item1')}</li>
            <li>{t('dataCollection.personal.item2')}</li>
            <li>{t('dataCollection.personal.item3')}</li>
            <li>{t('dataCollection.personal.item4')}</li>
            <li>{t('dataCollection.personal.item5')}</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataCollection.business.title')}</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
            <li>{t('dataCollection.business.item1')}</li>
            <li>{t('dataCollection.business.item2')}</li>
            <li>{t('dataCollection.business.item3')}</li>
            <li>{t('dataCollection.business.item4')}</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataCollection.usage.title')}</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
            <li>{t('dataCollection.usage.item1')}</li>
            <li>{t('dataCollection.usage.item2')}</li>
            <li>{t('dataCollection.usage.item3')}</li>
            <li>{t('dataCollection.usage.item4')}</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataCollection.transaction.title')}</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>{t('dataCollection.transaction.item1')}</li>
            <li>{t('dataCollection.transaction.item2')}</li>
            <li>{t('dataCollection.transaction.item3')}</li>
            <li>{t('dataCollection.transaction.item4')}</li>
          </ul>
        </section>

        {/* 2. How We Use Your Information */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('dataUsage.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('dataUsage.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('dataUsage.item1')}</li>
            <li>{t('dataUsage.item2')}</li>
            <li>{t('dataUsage.item3')}</li>
            <li>{t('dataUsage.item4')}</li>
            <li>{t('dataUsage.item5')}</li>
            <li>{t('dataUsage.item6')}</li>
            <li>{t('dataUsage.item7')}</li>
            <li>{t('dataUsage.item8')}</li>
          </ul>
        </section>

        {/* 3. Information Sharing */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('dataSharing.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">{t('dataSharing.description')}</p>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataSharing.serviceProviders.title')}</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">{t('dataSharing.serviceProviders.description')}</p>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataSharing.otherUsers.title')}</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">{t('dataSharing.otherUsers.description')}</p>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataSharing.legal.title')}</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">{t('dataSharing.legal.description')}</p>

          <h3 className="text-lg font-medium text-foreground mb-2">{t('dataSharing.businessTransfers.title')}</h3>
          <p className="text-muted-foreground leading-relaxed">{t('dataSharing.businessTransfers.description')}</p>
        </section>

        {/* 4. Data Security */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('security.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('security.description')}</p>
        </section>

        {/* 5. Data Retention */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('retention.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('retention.description')}</p>
        </section>

        {/* 6. Your Rights */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('rights.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('rights.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-3">
            <li>{t('rights.item1')}</li>
            <li>{t('rights.item2')}</li>
            <li>{t('rights.item3')}</li>
            <li>{t('rights.item4')}</li>
            <li>{t('rights.item5')}</li>
            <li>{t('rights.item6')}</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">{t('rights.contactNote')}</p>
        </section>

        {/* 7. Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('cookies.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('cookies.description')}</p>
        </section>

        {/* 8. International Transfers */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('internationalTransfers.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('internationalTransfers.description')}</p>
        </section>

        {/* 9. Children's Privacy */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('children.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('children.description')}</p>
        </section>

        {/* 10. Changes */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('changes.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('changes.description')}</p>
        </section>

        {/* 11. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('contact.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">{t('contact.description')}</p>
          <ul className="list-none space-y-1 text-muted-foreground">
            <li>{t('contact.email')}</li>
            <li>{t('contact.phone')}</li>
            <li>{t('contact.address')}</li>
          </ul>
        </section>

        <section>
          <p className="text-muted-foreground leading-relaxed font-medium">{t('consent')}</p>
        </section>

        <hr className="border-border" />
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('seeAlso')}</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/terms" className="text-sm text-primary hover:underline">{t('termsLink')}</Link>
            <span className="text-border">·</span>
            <Link href="/cookies" className="text-sm text-primary hover:underline">{t('cookiesLink')}</Link>
            <span className="text-border">·</span>
            <Link href="/refund-policy" className="text-sm text-primary hover:underline">{t('refundLink')}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
