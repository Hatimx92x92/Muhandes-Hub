'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CitySelect } from '@/components/forms/city-select';
import { cn } from '@/lib/utils';
import { RegisterStep3Schema } from '@/schemas/auth';
import type { WizardData } from '../register-wizard';

// =============================================================================
// Step 3: Profile & Company Details
// =============================================================================

interface ProfileStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  fieldErrors: Record<string, string[]>;
  onNext: () => void;
  onBack: () => void;
}

export function ProfileStep({ data, updateData, fieldErrors, onNext, onBack }: ProfileStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = useTranslations('auth.profileStep');
  const tc = useTranslations('common');

  // PO & Buyer can choose company or personal; Contractor & Supplier are always company
  const canChooseProfileType = data.role === 'project_owner' || data.role === 'buyer';
  const showCompanyFields = data.profile_type === 'company';

  const handleNext = () => {
    const result = RegisterStep3Schema.safeParse({
      profile_type: data.profile_type,
      company_name_ar: data.company_name_ar || undefined,
      company_name_en: data.company_name_en || undefined,
      cr_number: data.cr_number || undefined,
      website: data.website || undefined,
      city: data.city,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }

    setErrors({});
    onNext();
  };

  const getError = (field: string) =>
    errors[field] || fieldErrors[field]?.[0] || '';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{t('title')}</h3>

      {/* Profile type selector — only for PO & Buyer */}
      {canChooseProfileType && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t('profileType')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateData({ profile_type: 'company' })}
              className={cn(
                'rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors',
                data.profile_type === 'company'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {t('company')}
            </button>
            <button
              type="button"
              onClick={() => updateData({ profile_type: 'personal' })}
              className={cn(
                'rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors',
                data.profile_type === 'personal'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {t('individual')}
            </button>
          </div>
        </div>
      )}

      {/* Company fields — shown for company profile or contractor/supplier */}
      {showCompanyFields && (
        <>
          <Input
            label={t('companyNameAr')}
            name="company_name_ar"
            value={data.company_name_ar}
            onChange={(e) => updateData({ company_name_ar: e.target.value })}
            error={getError('company_name_ar')}
            placeholder="اسم الشركة بالعربية"
          />

          <Input
            label={t('companyNameEn')}
            name="company_name_en"
            dir="ltr"
            value={data.company_name_en}
            onChange={(e) => updateData({ company_name_en: e.target.value })}
            error={getError('company_name_en')}
            placeholder="Company name in English"
          />

          <Input
            label={t('crNumber')}
            name="cr_number"
            dir="ltr"
            value={data.cr_number}
            onChange={(e) => updateData({ cr_number: e.target.value })}
            error={getError('cr_number')}
            placeholder="مثال: 1010XXXXXX"
          />

          <Input
            label={t('website')}
            name="website"
            type="url"
            dir="ltr"
            value={data.website}
            onChange={(e) => updateData({ website: e.target.value })}
            error={getError('website')}
            placeholder="https://example.com"
          />
        </>
      )}

      <CitySelect
        label={t('city')}
        name="city"
        value={data.city}
        onChange={(e) => updateData({ city: e.target.value })}
        placeholder="اختر المدينة"
        error={getError('city')}
      />

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
