'use client';

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { register } from '@/actions/auth';
import type { UserRole, ProfileType, SubscriptionTier } from '@/types/enums';
import { StepIndicator } from './step-indicator';
import { RoleStep } from './steps/role-step';
import { AccountStep } from './steps/account-step';
import { ProfileStep } from './steps/profile-step';
import { TierStep } from './steps/tier-step';
import { ConfirmStep } from './steps/confirm-step';

// =============================================================================
// Wizard State
// =============================================================================

export interface WizardData {
  // Step 1
  role: UserRole | '';
  // Step 2
  full_name: string;
  email: string;
  password: string;
  phone: string;
  pdpl_consent: boolean;
  // Step 3
  profile_type: ProfileType;
  company_name_ar: string;
  company_name_en: string;
  cr_number: string;
  website: string;
  city: string;
  // Step 4
  tier: SubscriptionTier;
  duration_months: number;
  coupon_code: string;
}

const initialData: WizardData = {
  role: '',
  full_name: '',
  email: '',
  password: '',
  phone: '',
  pdpl_consent: false,
  profile_type: 'company',
  company_name_ar: '',
  company_name_en: '',
  cr_number: '',
  website: '',
  city: '',
  tier: 'starter',
  duration_months: 1,
  coupon_code: '',
};

// =============================================================================
// Step configuration
// =============================================================================

interface StepConfig {
  key: string;
  label: string;
}

function getSteps(role: string, t: (key: string) => string): StepConfig[] {
  const base: StepConfig[] = [
    { key: 'role', label: t('role') },
    { key: 'account', label: t('account') },
    { key: 'profile', label: t('profileStep') },
  ];

  // Only contractors and suppliers choose a subscription tier
  if (role === 'contractor' || role === 'supplier') {
    base.push({ key: 'tier', label: t('plan') });
  }

  base.push({ key: 'confirm', label: t('confirmStep') });
  return base;
}

// =============================================================================
// Registration Wizard
// =============================================================================

export function RegisterWizard() {
  const router = useRouter();
  const t = useTranslations('auth.wizard');
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const steps = getSteps(data.role, t);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setServerError(null);
    setFieldErrors({});
  }, []);

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [steps.length]);

  const back = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    setServerError(null);
    setFieldErrors({});
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setServerError(null);

    const formData = new FormData();
    formData.set('role', data.role);
    formData.set('full_name', data.full_name);
    formData.set('email', data.email);
    formData.set('password', data.password);
    formData.set('phone', data.phone);
    formData.set('pdpl_consent', String(data.pdpl_consent));
    formData.set('profile_type', data.profile_type);
    formData.set('city', data.city);
    if (data.company_name_ar) formData.set('company_name_ar', data.company_name_ar);
    if (data.company_name_en) formData.set('company_name_en', data.company_name_en);
    if (data.cr_number) formData.set('cr_number', data.cr_number);
    if (data.website) formData.set('website', data.website);
    if (data.tier) formData.set('tier', data.tier);
    if (data.duration_months) formData.set('duration_months', String(data.duration_months));
    if (data.coupon_code) formData.set('coupon_code', data.coupon_code);

    const result = await register(null, formData);

    if (result.error) {
      setServerError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      setSubmitting(false);
      return;
    }

    // Success — redirect based on flow
    if (result.data?.requiresPayment) {
      router.push('/verify/email-sent');
    } else {
      router.push('/verify/email-sent');
    }
  }, [data, router]);

  // Current step key
  const stepKey = steps[currentStep]?.key;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Server Error */}
      {serverError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Step Content */}
      {stepKey === 'role' && (
        <RoleStep data={data} updateData={updateData} onNext={next} />
      )}
      {stepKey === 'account' && (
        <AccountStep
          data={data}
          updateData={updateData}
          fieldErrors={fieldErrors}
          onNext={next}
          onBack={back}
        />
      )}
      {stepKey === 'profile' && (
        <ProfileStep
          data={data}
          updateData={updateData}
          fieldErrors={fieldErrors}
          onNext={next}
          onBack={back}
        />
      )}
      {stepKey === 'tier' && (
        <TierStep data={data} updateData={updateData} onNext={next} onBack={back} />
      )}
      {stepKey === 'confirm' && (
        <ConfirmStep
          data={data}
          submitting={submitting}
          onSubmit={handleSubmit}
          onBack={back}
        />
      )}
    </div>
  );
}
