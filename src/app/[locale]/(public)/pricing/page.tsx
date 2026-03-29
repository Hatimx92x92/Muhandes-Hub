// =============================================================================
// Pricing Page — subscription tier comparison with role-specific features
// =============================================================================

import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';
import { Check, X, Minus } from 'lucide-react';
import { SUBSCRIPTION_PRICING, DURATION_DISCOUNTS, VAT_RATE } from '@/types';
import { getTranslations, getLocale } from 'next-intl/server';
import { PricingBorderBeam } from '@/components/features/pricing-border-beam';

// ---------------------------------------------------------------------------
// Feature value cell
// ---------------------------------------------------------------------------

type FeatureValue = boolean | string;

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function PricingPage() {
  const t = await getTranslations('pricing');
  const locale = await getLocale();

  // ---------------------------------------------------------------------------
  // Tier data (translated)
  // ---------------------------------------------------------------------------

  const tierIds = ['starter', 'pro', 'business', 'enterprise'] as const;

  const tiers = tierIds.map((id) => ({
    id,
    name: t(`tiers.${id}.name`),
    nameEn: id.charAt(0).toUpperCase() + id.slice(1),
    description: t(`tiers.${id}.description`),
    price: SUBSCRIPTION_PRICING[id].monthly,
    highlighted: id === 'pro',
  }));

  // ---------------------------------------------------------------------------
  // Feature sections (translated)
  // ---------------------------------------------------------------------------

  const fv = (key: string) => t(`featureValues.${key}`);

  const featureSections: { title: string; features: { label: string; starter: FeatureValue; pro: FeatureValue; business: FeatureValue; enterprise: FeatureValue }[] }[] = [
    {
      title: t('featureSections.contractor'),
      features: [
        { label: t('featureLabels.bidsMonth'), starter: '10', pro: '50', business: '100', enterprise: fv('unlimited') },
        { label: t('featureLabels.kanban'), starter: false, pro: fv('checklist'), business: fv('full'), enterprise: fv('full') },
      ],
    },
    {
      title: t('featureSections.supplier'),
      features: [
        { label: t('featureLabels.productListings'), starter: '2', pro: '10', business: '50', enterprise: fv('unlimited') },
        { label: t('featureLabels.bulkCsv'), starter: false, pro: false, business: true, enterprise: true },
      ],
    },
    {
      title: t('featureSections.common'),
      features: [
        { label: t('featureLabels.crmClients'), starter: '20', pro: '200', business: fv('unlimited'), enterprise: fv('unlimited') },
        { label: t('featureLabels.quotationsMonth'), starter: '3', pro: '20', business: fv('unlimited'), enterprise: fv('unlimited') },
        { label: t('featureLabels.contractsMonth'), starter: fv('basic'), pro: '10', business: fv('unlimited'), enterprise: fv('unlimited') },
        { label: t('featureLabels.analyticsFeature'), starter: false, pro: fv('summary'), business: fv('full'), enterprise: fv('full') },
        { label: t('featureLabels.clauseLibrary'), starter: false, pro: true, business: true, enterprise: true },
        { label: t('featureLabels.customContracts'), starter: false, pro: false, business: true, enterprise: true },
        { label: t('featureLabels.commission'), starter: '2%', pro: '1%', business: '0%', enterprise: '0%' },
      ],
    },
  ];

  // ---------------------------------------------------------------------------
  // Duration discounts
  // ---------------------------------------------------------------------------

  const durations = [
    { months: 1, label: t('durations.monthly'), discount: DURATION_DISCOUNTS[1] },
    { months: 3, label: t('durations.quarterly'), discount: DURATION_DISCOUNTS[3] },
    { months: 6, label: t('durations.semiAnnual'), discount: DURATION_DISCOUNTS[6] },
    { months: 12, label: t('durations.annual'), discount: DURATION_DISCOUNTS[12] },
  ];

  function formatPrice(amount: number): string {
    if (amount === 0) return t('free');
    return `${amount.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')} ${t('sar')}`;
  }

  // ---------------------------------------------------------------------------
  // FAQ
  // ---------------------------------------------------------------------------

  const faqs = [1, 2, 3, 4].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }));

  return (
    <div className="py-20">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Duration discount info */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
        {durations.map((d) => (
          <div
            key={d.months}
            className="rounded-xl border border-border bg-card px-5 py-3 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
          >
            <p className="text-sm font-bold text-foreground">{d.label}</p>
            {d.discount > 0 && (
              <p className="text-xs text-primary font-bold mt-0.5">
                {t('discountLabel', { percent: (d.discount * 100).toFixed(0) })}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tier cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const monthlyWithVAT = tier.price * (1 + VAT_RATE);
          return (
            <div
              key={tier.id}
              className={`rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                tier.highlighted
                  ? 'border-primary bg-primary/5 shadow-xl ring-2 ring-primary relative'
                  : 'border-border bg-card hover:border-primary/20'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 inset-s-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-primary to-primary-dark px-4 py-1 text-xs font-bold text-primary-foreground shadow-md">
                  {t('mostPopular')}
                </div>
              )}
              {tier.highlighted && <PricingBorderBeam />}
              <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
              <p className="text-sm text-muted-foreground">{tier.nameEn}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tier.description}</p>

              <div className="mt-4">
                <p className="text-3xl font-extrabold text-foreground">
                  {tier.price === 0 ? t('free') : formatPrice(monthlyWithVAT)}
                </p>
                {tier.price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{t('monthlyVat')}</p>
                )}
              </div>

              <div className="flex-1" />

              <Link
                href={`/register${tier.id !== 'starter' ? `?tier=${tier.id}` : ''}`}
                className={`mt-6 inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                  tier.highlighted
                    ? 'bg-linear-to-r from-primary to-primary-dark text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02]'
                    : tier.price === 0
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'border-2 border-border text-foreground hover:bg-muted hover:border-primary/30'
                }`}
              >
                {tier.price === 0 ? t('startFree') : t('subscribe')}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-20">
        <h2 className="text-2xl font-extrabold text-foreground mb-8 text-center">
          {t('compare')}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-4 pe-4 ps-6 text-start text-foreground font-bold">{t('feature')}</th>
                {tiers.map((tier) => (
                  <th
                    key={tier.id}
                    className={`py-4 px-4 text-center font-bold ${
                      tier.highlighted ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureSections.map((section) => (
                <Fragment key={section.title}>
                  <tr>
                    <td
                      colSpan={5}
                      className="pt-6 pb-2 ps-6 text-sm font-bold text-primary"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.features.map((feature) => (
                    <tr
                      key={feature.label}
                      className="border-b border-border/50"
                    >
                      <td className="py-3 ps-6 pe-4 text-muted-foreground">
                        {feature.label}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FeatureCell value={feature.starter} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FeatureCell value={feature.pro} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FeatureCell value={feature.business} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FeatureCell value={feature.enterprise} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-8 text-center">
          {t('faq.title')}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/20 hover:shadow-sm">
              <h3 className="font-bold text-foreground">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
