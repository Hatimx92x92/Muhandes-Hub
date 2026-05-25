// =============================================================================
// Terms of Service — شروط الخدمة
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
  const t = await getTranslations('metadata.terms');

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
      canonical: `${BASE_URL}/${locale}/terms`,
      languages: {
        ar: `${BASE_URL}/ar/terms`,
        en: `${BASE_URL}/en/terms`,
      },
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal.terms');

  return (
    <div className="mx-auto max-w-4xl py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

      <div className="space-y-8">
        <section>
          <p className="text-muted-foreground leading-relaxed">{t('intro')}</p>
        </section>

        {/* 1. Definitions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('definitions.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('definitions.description')}</p>
        </section>

        {/* 2. Acceptance */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('acceptance.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('acceptance.description')}</p>
        </section>

        {/* 3. Eligibility */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('eligibility.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('eligibility.description')}</p>
        </section>

        {/* 4. Accounts */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('accounts.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('accounts.item1')}</li>
            <li>{t('accounts.item2')}</li>
            <li>{t('accounts.item3')}</li>
            <li>{t('accounts.item4')}</li>
            <li>{t('accounts.item5')}</li>
            <li>{t('accounts.item6')}</li>
            <li>{t('accounts.item7')}</li>
          </ul>
        </section>

        {/* 5. Subscriptions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('subscriptions.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('subscriptions.item1')}</li>
            <li>{t('subscriptions.item2')}</li>
            <li>{t('subscriptions.item3')}</li>
            <li>{t('subscriptions.item4')}</li>
            <li>{t('subscriptions.item5')}</li>
            <li>{t('subscriptions.item6')}</li>
            <li>{t('subscriptions.item7')}</li>
          </ul>
        </section>

        {/* 6. Commissions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('commissions.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('commissions.item1')}</li>
            <li>{t('commissions.item2')}</li>
            <li>{t('commissions.item3')}</li>
            <li>{t('commissions.item4')}</li>
            <li>{t('commissions.item5')}</li>
            <li>{t('commissions.item6')}</li>
            <li>{t('commissions.item7')}</li>
          </ul>
        </section>

        {/* 7. No Refund */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('noRefund.title')}</h2>
          <p className="text-muted-foreground leading-relaxed font-medium">{t('noRefund.description')}</p>
        </section>

        {/* 8. Content & IP */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('content.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('content.item1')}</li>
            <li>{t('content.item2')}</li>
            <li>{t('content.item3')}</li>
            <li>{t('content.item4')}</li>
            <li>{t('content.item5')}</li>
            <li>{t('content.item6')}</li>
            <li>{t('content.item7')}</li>
          </ul>
        </section>

        {/* 9. Prohibited Activities */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('prohibited.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('prohibited.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('prohibited.item1')}</li>
            <li>{t('prohibited.item2')}</li>
            <li>{t('prohibited.item3')}</li>
            <li>{t('prohibited.item4')}</li>
            <li>{t('prohibited.item5')}</li>
            <li>{t('prohibited.item6')}</li>
            <li>{t('prohibited.item7')}</li>
            <li>{t('prohibited.item8')}</li>
            <li>{t('prohibited.item9')}</li>
            <li>{t('prohibited.item10')}</li>
          </ul>
        </section>

        {/* 10. Verification */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('verification.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('verification.description')}</p>
        </section>

        {/* 11. Platform Role */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('platformRole.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('platformRole.description')}</p>
        </section>

        {/* 12. Limitation of Liability */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('liability.title')}</h2>
          <p className="text-muted-foreground leading-relaxed font-medium">{t('liability.description')}</p>
        </section>

        {/* 13. Indemnification */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('indemnification.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('indemnification.description')}</p>
        </section>

        {/* 14. Termination */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('termination.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('termination.description')}</p>
        </section>

        {/* 15. Disputes */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('disputes.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('disputes.description')}</p>
        </section>

        {/* 16. Force Majeure */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('forceMajeure.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('forceMajeure.description')}</p>
        </section>

        {/* 17. Amendments */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('amendments.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('amendments.description')}</p>
        </section>

        {/* 18. Severability */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('severability.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('severability.description')}</p>
        </section>

        {/* 19. Entire Agreement */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('entireAgreement.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('entireAgreement.description')}</p>
        </section>

        {/* 20. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('contactInfo.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">{t('contactInfo.description')}</p>
          <ul className="list-none space-y-1 text-muted-foreground mb-2">
            <li>{t('contactInfo.email')}</li>
            <li>{t('contactInfo.phone')}</li>
            <li>{t('contactInfo.address')}</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed text-sm">{t('contactInfo.notice')}</p>
        </section>

        <section>
          <p className="text-muted-foreground leading-relaxed font-semibold">{t('acknowledgment')}</p>
        </section>

        <hr className="border-border" />
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('seeAlso')}</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/privacy" className="text-sm text-primary hover:underline">{t('privacyLink')}</Link>
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
