'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { SAUDI_CITIES } from '@/components/forms/city-select';
import { Pencil } from 'lucide-react';
import type { WizardData } from '../register-wizard';

// =============================================================================
// Step 5 (Final): Confirm & Submit
// =============================================================================

interface ConfirmStepProps {
  data: WizardData;
  submitting: boolean;
  isOAuthMode?: boolean;
  onSubmit: () => void;
  onBack: () => void;
  onGoToStep?: (stepKey: string) => void;
}

export function ConfirmStep({ data, submitting, isOAuthMode = false, onSubmit, onBack, onGoToStep }: ConfirmStepProps) {
  const t = useTranslations('auth.confirmStep');
  const tr = useTranslations('auth.roleStep');
  const tp = useTranslations('pricing.tiers');
  const tc = useTranslations('common');
  const locale = useLocale();
  const showTier = data.role === 'contractor' || data.role === 'supplier';

  const roleKeyMap: Record<string, string> = {
    project_owner: 'projectOwner',
    contractor: 'contractor',
    supplier: 'supplier',
    buyer: 'buyer',
  };

  const profileTypeMap: Record<string, string> = {
    company: t('companyType'),
    personal: t('personalType'),
  };

  const EditBtn = ({ step }: { step: string }) =>
    onGoToStep ? (
      <button
        type="button"
        onClick={() => onGoToStep(step)}
        className="text-muted-foreground hover:text-primary transition-colors ms-2"
        aria-label={t('editLabel')}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    ) : null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{t('title')}</h3>

      <div className="rounded-lg border border-border divide-y divide-border">
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-muted-foreground">{t('role')}</span>
          <span className="text-sm font-medium flex items-center">
            {data.role ? tr(`${roleKeyMap[data.role]}.title`) : data.role}
            <EditBtn step="role" />
          </span>
        </div>
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-muted-foreground">{t('name')}</span>
          <span className="text-sm font-medium flex items-center">
            {data.full_name}
            <EditBtn step={isOAuthMode ? 'profile' : 'account'} />
          </span>
        </div>
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-muted-foreground">{t('email')}</span>
          <span className="text-sm font-medium flex items-center" dir="ltr">
            {data.email}
          </span>
        </div>
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-muted-foreground">{t('phone')}</span>
          <span className="text-sm font-medium flex items-center" dir="ltr">
            +966{data.phone}
            <EditBtn step={isOAuthMode ? 'profile' : 'account'} />
          </span>
        </div>
        <div className="flex justify-between items-center p-3">
          <span className="text-sm text-muted-foreground">{t('profileType')}</span>
          <span className="text-sm font-medium flex items-center">
            {profileTypeMap[data.profile_type]}
            <EditBtn step="profile" />
          </span>
        </div>
        {data.profile_type === 'company' && data.company_name_ar && (
          <div className="flex justify-between items-center p-3">
            <span className="text-sm text-muted-foreground">{t('company')}</span>
            <span className="text-sm font-medium flex items-center">
              {data.company_name_ar}
              <EditBtn step="profile" />
            </span>
          </div>
        )}
        {data.city && (
          <div className="flex justify-between items-center p-3">
            <span className="text-sm text-muted-foreground">{t('city')}</span>
            <span className="text-sm font-medium flex items-center">
              {SAUDI_CITIES.find((c) => c.value === data.city)?.[locale === 'en' ? 'label_en' : 'label_ar'] ?? data.city}
              <EditBtn step="profile" />
            </span>
          </div>
        )}
        {showTier && (
          <div className="flex justify-between items-center p-3">
            <span className="text-sm text-muted-foreground">{t('tier')}</span>
            <span className="text-sm font-medium flex items-center">
              {tp(`${data.tier}.name`)}
              <EditBtn step="tier" />
            </span>
          </div>
        )}
        {showTier && data.tier !== 'starter' && data.payment_method && (
          <div className="flex justify-between items-center p-3">
            <span className="text-sm text-muted-foreground">{t('paymentMethod')}</span>
            <span className="text-sm font-medium flex items-center">
              {data.payment_method === 'card' ? t('paymentCard') : t('paymentBank')}
              <EditBtn step="payment" />
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={submitting}>
          {tc('back')}
        </Button>
        <Button onClick={onSubmit} className="flex-1" loading={submitting}>
          {t('submit')}
        </Button>
      </div>
    </div>
  );
}
