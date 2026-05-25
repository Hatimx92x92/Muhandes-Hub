'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Building } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SUBSCRIPTION_PRICING, DURATION_DISCOUNTS, VAT_RATE } from '@/types';
import { formatSAR } from '@/lib/utils';
import type { WizardData } from '../register-wizard';
import type { SubscriptionTier } from '@/types/enums';

// =============================================================================
// Step 4: Subscription Tier Selection (Contractor/Supplier only)
// =============================================================================

const TIERS = [
  {
    value: 'starter' as const,
    key: 'starter',
    featureKeys: ['bids10', 'products2', 'crm20', 'commission2'],
  },
  {
    value: 'pro' as const,
    key: 'pro',
    featureKeys: ['bids50', 'products10', 'crm200', 'commission1', 'checklist'],
  },
  {
    value: 'business' as const,
    key: 'business',
    featureKeys: ['bids100', 'products50', 'crmUnlimited', 'commission0', 'fullKanban', 'csvUpload'],
  },
  {
    value: 'enterprise' as const,
    key: 'enterprise',
    featureKeys: ['bidsUnlimited', 'productsUnlimited', 'commission0', 'allFeatures', 'customContracts'],
  },
] as const;

const DURATIONS = [
  { value: 1, key: 'monthly' },
  { value: 3, key: 'quarterly' },
  { value: 6, key: 'semiAnnual' },
  { value: 12, key: 'annual' },
] as const;

interface TierStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function calculatePrice(tier: SubscriptionTier, months: number): number {
  const pricing = SUBSCRIPTION_PRICING[tier as keyof typeof SUBSCRIPTION_PRICING];
  if (!pricing) return 0;
  const discount = DURATION_DISCOUNTS[months as keyof typeof DURATION_DISCOUNTS] ?? 0;
  const monthlyAfterDiscount = pricing.monthly * (1 - discount);
  return monthlyAfterDiscount * months;
}

export function TierStep({ data, updateData, onNext, onBack }: TierStepProps) {
  const [error, setError] = useState('');
  const totalPrice = calculatePrice(data.tier, data.duration_months);
  const vatAmount = totalPrice * VAT_RATE / (1 + VAT_RATE); // Prices are VAT-inclusive
  const t = useTranslations('auth.tierStep');
  const tp = useTranslations('pricing');
  const tc = useTranslations('common');

  const isPaidTier = data.tier !== 'starter';

  const handleNext = () => {
    if (isPaidTier && !data.payment_method) {
      setError(t('selectPaymentMethod'));
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{t('title')}</h3>

      {/* Tier cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TIERS.map((tier) => {
          const isSelected = data.tier === tier.value;
          const price = SUBSCRIPTION_PRICING[tier.value].monthly;

          return (
            <button
              key={tier.value}
              type="button"
              onClick={() => updateData({ tier: tier.value })}
              className={cn(
                'flex flex-col rounded-xl border-2 p-4 text-start transition-all',
                'hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{tp(`tiers.${tier.key}.name`)}</span>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <span className="text-lg font-bold text-foreground mb-2">
                {price === 0 ? tc('free') : `${formatSAR(price)} / ${tc('monthly')}`}
              </span>
              <ul className="space-y-1">
                {tier.featureKeys.map((fk) => (
                  <li key={fk} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    {t(`features.${fk}`)}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Duration selector — only for paid tiers */}
      {data.tier !== 'starter' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">{tp('durations.monthly')}</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => updateData({ duration_months: d.value })}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  data.duration_months === d.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {t(d.key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coupon code */}
      {data.tier !== 'starter' && (
        <Input
          label={t('couponLabel')}
          name="coupon_code"
          dir="ltr"
          value={data.coupon_code}
          onChange={(e) => updateData({ coupon_code: e.target.value })}
          placeholder={t('couponPlaceholder')}
        />
      )}

      {/* Price summary */}
      {data.tier !== 'starter' && totalPrice > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc('vatInclusive')}</span>
            <span className="font-semibold">{formatSAR(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{tc('vat15')}</span>
            <span>{formatSAR(vatAmount)}</span>
          </div>
        </div>
      )}

      {/* Payment method selector — only for paid tiers */}
      {isPaidTier && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">{t('paymentMethodTitle')}</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { updateData({ payment_method: 'bank_transfer' }); setError(''); }}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:border-primary/50',
                data.payment_method === 'bank_transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background',
              )}
            >
              <span className="absolute -top-2 start-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                {t('paymentBankRecommended')}
              </span>
              <Building className={cn('h-6 w-6', data.payment_method === 'bank_transfer' ? 'text-primary' : 'text-muted-foreground')} />
              <span className="font-medium text-sm">{t('paymentBank')}</span>
              <span className="text-xs text-muted-foreground">{t('paymentBankDesc')}</span>
            </button>
            <button
              type="button"
              onClick={() => { updateData({ payment_method: 'card' }); setError(''); }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:border-primary/50',
                data.payment_method === 'card'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background',
              )}
            >
              <CreditCard className={cn('h-6 w-6', data.payment_method === 'card' ? 'text-primary' : 'text-muted-foreground')} />
              <span className="font-medium text-sm">{t('paymentCard')}</span>
              <span className="text-xs text-muted-foreground">{t('paymentCardDesc')}</span>
            </button>
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {tc('back')}
        </Button>
        <Button onClick={handleNext} className="flex-1">
          {tc('next')}
        </Button>
      </div>
    </div>
  );
}
