// =============================================================================
// Terms of Service — شروط الاستخدام
// =============================================================================

import { getTranslations } from 'next-intl/server';

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

      <div className="prose-custom space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('registration.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('intro')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('registration.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('registration.item1')}</li>
            <li>{t('registration.item2')}</li>
            <li>{t('registration.item3')}</li>
            <li>{t('registration.item4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('subscriptions.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('subscriptions.item1')}</li>
            <li>{t('subscriptions.item2')}</li>
            <li>{t('subscriptions.item3')}</li>
            <li>{t('subscriptions.item4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('commissions.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('commissions.item1')}</li>
            <li>{t('commissions.item2')}</li>
            <li>{t('commissions.item3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('postsAndOffers.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('postsAndOffers.item1')}</li>
            <li>{t('postsAndOffers.item2')}</li>
            <li>{t('postsAndOffers.item3')}</li>
            <li>{t('postsAndOffers.item4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('reviews.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('reviews.item1')}</li>
            <li>{t('reviews.item2')}</li>
            <li>{t('reviews.item3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('liability.title')}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>{t('liability.item1')}</li>
            <li>{t('liability.item2')}</li>
            <li>{t('liability.item3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('modifications.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('modifications.description')}
          </p>
        </section>
      </div>
    </div>
  );
}
