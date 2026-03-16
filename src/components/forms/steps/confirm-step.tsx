'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { WizardData } from '../register-wizard';

// =============================================================================
// Step 5 (Final): Confirm & Submit
// =============================================================================

interface ConfirmStepProps {
  data: WizardData;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function ConfirmStep({ data, submitting, onSubmit, onBack }: ConfirmStepProps) {
  const t = useTranslations('auth.confirmStep');
  const tr = useTranslations('auth.roleStep');
  const tp = useTranslations('pricing.tiers');
  const tc = useTranslations('common');
  const showTier = data.role === 'contractor' || data.role === 'supplier';

  const roleKeyMap: Record<string, string> = {
    project_owner: 'projectOwner',
    contractor: 'contractor',
    supplier: 'supplier',
    buyer: 'buyer',
  };

  const profileTypeMap: Record<string, string> = {
    company: t('company'),
    personal: t('profileType'),
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{t('title')}</h3>

      <div className="rounded-lg border border-border divide-y divide-border">
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">{t('role')}</span>
          <span className="text-sm font-medium">{data.role ? tr(`${roleKeyMap[data.role]}.title`) : data.role}</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">{t('name')}</span>
          <span className="text-sm font-medium">{data.full_name}</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">{t('email')}</span>
          <span className="text-sm font-medium" dir="ltr">{data.email}</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">{t('phone')}</span>
          <span className="text-sm font-medium" dir="ltr">+966{data.phone}</span>
        </div>
        <div className="flex justify-between p-3">
          <span className="text-sm text-muted-foreground">{t('profileType')}</span>
          <span className="text-sm font-medium">{profileTypeMap[data.profile_type]}</span>
        </div>
        {data.profile_type === 'company' && data.company_name_ar && (
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">{t('company')}</span>
            <span className="text-sm font-medium">{data.company_name_ar}</span>
          </div>
        )}
        {data.city && (
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">{t('city')}</span>
            <span className="text-sm font-medium">{data.city}</span>
          </div>
        )}
        {showTier && (
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">{t('tier')}</span>
            <span className="text-sm font-medium">{tp(`${data.tier}.name`)}</span>
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
