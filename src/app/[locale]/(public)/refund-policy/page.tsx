// =============================================================================
// Refund Policy — سياسة الاسترداد
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
  const t = await getTranslations('metadata.refundPolicy');

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
      canonical: `${BASE_URL}/${locale}/refund-policy`,
      languages: {
        ar: `${BASE_URL}/ar/refund-policy`,
        en: `${BASE_URL}/en/refund-policy`,
      },
    },
  };
}

export default async function RefundPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal.refund');

  return (
    <div className="mx-auto max-w-4xl py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

      <div className="space-y-8">
        <section>
          <p className="text-muted-foreground leading-relaxed font-medium">{t('intro')}</p>
        </section>

        {/* 1. General No-Refund Policy */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('generalPolicy.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('generalPolicy.description')}</p>
        </section>

        {/* 2. Subscription Fees */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('subscriptionFees.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('subscriptionFees.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('subscriptionFees.item1')}</li>
            <li>{t('subscriptionFees.item2')}</li>
            <li>{t('subscriptionFees.item3')}</li>
            <li>{t('subscriptionFees.item4')}</li>
            <li>{t('subscriptionFees.item5')}</li>
            <li>{t('subscriptionFees.item6')}</li>
            <li>{t('subscriptionFees.item7')}</li>
            <li>{t('subscriptionFees.item8')}</li>
            <li>{t('subscriptionFees.item9')}</li>
            <li>{t('subscriptionFees.item10')}</li>
          </ul>
        </section>

        {/* 3. Commissions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('commissions.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('commissions.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('commissions.item1')}</li>
            <li>{t('commissions.item2')}</li>
            <li>{t('commissions.item3')}</li>
            <li>{t('commissions.item4')}</li>
            <li>{t('commissions.item5')}</li>
            <li>{t('commissions.item6')}</li>
            <li>{t('commissions.item7')}</li>
            <li>{t('commissions.item8')}</li>
          </ul>
        </section>

        {/* 4. Deal Cancellations */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('dealCancellations.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('dealCancellations.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('dealCancellations.item1')}</li>
            <li>{t('dealCancellations.item2')}</li>
            <li>{t('dealCancellations.item3')}</li>
            <li>{t('dealCancellations.item4')}</li>
            <li>{t('dealCancellations.item5')}</li>
            <li>{t('dealCancellations.item6')}</li>
            <li>{t('dealCancellations.item7')}</li>
            <li>{t('dealCancellations.item8')}</li>
          </ul>
        </section>

        {/* 5. Credit Notes */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('creditNotes.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('creditNotes.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('creditNotes.item1')}</li>
            <li>{t('creditNotes.item2')}</li>
            <li>{t('creditNotes.item3')}</li>
            <li>{t('creditNotes.item4')}</li>
            <li>{t('creditNotes.item5')}</li>
            <li>{t('creditNotes.item6')}</li>
            <li>{t('creditNotes.item7')}</li>
          </ul>
        </section>

        {/* 6. Chargebacks */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('chargebacks.title')}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('chargebacks.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('chargebacks.item1')}</li>
            <li>{t('chargebacks.item2')}</li>
            <li>{t('chargebacks.item3')}</li>
            <li>{t('chargebacks.item4')}</li>
            <li>{t('chargebacks.item5')}</li>
            <li>{t('chargebacks.item6')}</li>
            <li>{t('chargebacks.item7')}</li>
          </ul>
        </section>

        {/* 7. Dispute Resolution */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('disputeResolution.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('disputeResolution.description')}</p>
        </section>

        {/* 8. Liability Limit */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('liabilityLimit.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('liabilityLimit.item1')}</li>
            <li>{t('liabilityLimit.item2')}</li>
            <li>{t('liabilityLimit.item3')}</li>
            <li>{t('liabilityLimit.item4')}</li>
            <li>{t('liabilityLimit.item5')}</li>
            <li>{t('liabilityLimit.item6')}</li>
            <li>{t('liabilityLimit.item7')}</li>
          </ul>
        </section>

        {/* 9. Saudi Law Compliance */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('saudiLaw.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('saudiLaw.description')}</p>
        </section>

        {/* 10. Changes */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('changes.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('changes.description')}</p>
        </section>

        {/* 11. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('contactInfo.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('contactInfo.description')}</p>
        </section>

        <section>
          <p className="text-muted-foreground leading-relaxed font-semibold">{t('acknowledgment')}</p>
        </section>

        <hr className="border-border" />
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('seeAlso')}</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/terms" className="text-sm text-primary hover:underline">{t('termsLink')}</Link>
            <span className="text-border">·</span>
            <Link href="/privacy" className="text-sm text-primary hover:underline">{t('privacyLink')}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
