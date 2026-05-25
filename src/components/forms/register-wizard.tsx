'use client';

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { register, completeGoogleRegistration } from '@/actions/auth';
import type { UserRole, ProfileType, SubscriptionTier } from '@/types/enums';
import { StepIndicator } from './step-indicator';
import { RoleStep } from './steps/role-step';
import { AccountStep } from './steps/account-step';
import { ProfileStep } from './steps/profile-step';
import { TierStep } from './steps/tier-step';
import { PaymentStep } from './steps/payment-step';
import { ConfirmStep } from './steps/confirm-step';
import { DocumentStep } from './steps/document-step';

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
  vat_number: string;
  website: string;
  city: string;
  // Step 4
  tier: SubscriptionTier;
  duration_months: number;
  coupon_code: string;
  payment_method: 'card' | 'bank_transfer' | '';
  // Step 5 (bank transfer)
  bank_receipt: File | null;
  // Step 6 (verification documents — Pro+ contractors/suppliers)
  verification_docs: File[];
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
  vat_number: '',
  website: '',
  city: '',
  tier: 'starter',
  duration_months: 1,
  coupon_code: '',
  payment_method: '',
  bank_receipt: null,
  verification_docs: [],
};

// =============================================================================
// Step configuration
// =============================================================================

interface StepConfig {
  key: string;
  label: string;
}

function getSteps(role: string, tier: string, t: (key: string) => string): StepConfig[] {
  const base: StepConfig[] = [
    { key: 'role', label: t('role') },
    { key: 'account', label: t('account') },
    { key: 'profile', label: t('profileStep') },
  ];

  // Only contractors and suppliers choose a subscription tier
  if (role === 'contractor' || role === 'supplier') {
    base.push({ key: 'tier', label: t('plan') });
    // Payment step only for paid tiers
    if (tier !== 'starter') {
      base.push({ key: 'payment', label: t('payment') });
    }
  }

  // Document upload step for paid-tier contractors/suppliers
  if ((role === 'contractor' || role === 'supplier') && tier !== 'starter') {
    base.push({ key: 'documents', label: t('documents') });
  }

  base.push({ key: 'confirm', label: t('confirmStep') });
  return base;
}

// =============================================================================
// Registration Wizard
// =============================================================================

interface RegisterWizardProps {
  isOAuthMode?: boolean;
  oauthEmail?: string;
  oauthName?: string;
}

export function RegisterWizard({ isOAuthMode = false, oauthEmail = '', oauthName = '' }: RegisterWizardProps) {
  const router = useRouter();
  const t = useTranslations('auth.wizard');
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    ...initialData,
    ...(isOAuthMode ? { email: oauthEmail, full_name: oauthName } : {}),
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const steps = getSteps(data.role, data.tier, t);

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

  const goToStep = useCallback((key: string) => {
    const idx = steps.findIndex((s) => s.key === key);
    if (idx >= 0) setCurrentStep(idx);
  }, [steps]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setServerError(null);

    const formData = new FormData();
    formData.set('role', data.role);
    formData.set('phone', data.phone);
    formData.set('pdpl_consent', String(data.pdpl_consent));
    formData.set('profile_type', data.profile_type);
    formData.set('city', data.city);
    if (data.company_name_ar) formData.set('company_name_ar', data.company_name_ar);
    if (data.company_name_en) formData.set('company_name_en', data.company_name_en);
    if (data.cr_number) formData.set('cr_number', data.cr_number);
    if (data.vat_number) formData.set('vat_number', data.vat_number);
    if (data.website) formData.set('website', data.website);
    if (data.tier) formData.set('tier', data.tier);
    if (data.duration_months) formData.set('duration_months', String(data.duration_months));
    if (data.coupon_code) formData.set('coupon_code', data.coupon_code);
    if (data.payment_method) formData.set('payment_method', data.payment_method);
    if (data.bank_receipt) formData.set('bank_receipt', data.bank_receipt);
    if (data.verification_docs.length > 0) {
      data.verification_docs.forEach((file) => {
        formData.append('verification_docs', file);
      });
    }

    let result;

    if (isOAuthMode) {
      // Google OAuth: complete profile for existing auth user
      if (data.full_name) formData.set('full_name', data.full_name);
      result = await completeGoogleRegistration(null, formData);
    } else {
      // Email registration: create new account
      formData.set('full_name', data.full_name);
      formData.set('email', data.email);
      formData.set('password', data.password);
      result = await register(null, formData);
    }

    if (result.error) {
      setServerError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      setSubmitting(false);
      return;
    }

    // Success — redirect based on flow
    if (isOAuthMode) {
      // Google users skip email verification
      if (result.data?.requiresPayment) {
        router.push('/verify/payment');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/verify/email-sent');
    }
  }, [data, router, isOAuthMode]);

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
          isOAuthMode={isOAuthMode}
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
      {stepKey === 'payment' && (
        <PaymentStep
          data={data}
          updateData={updateData}
          submitting={submitting}
          onSubmit={handleSubmit}
          onBack={back}
        />
      )}
      {stepKey === 'documents' && (
        <DocumentStep
          data={data}
          updateData={updateData}
          onNext={next}
          onBack={back}
        />
      )}
      {stepKey === 'confirm' && (
        <ConfirmStep
          data={data}
          submitting={submitting}
          isOAuthMode={isOAuthMode}
          onSubmit={handleSubmit}
          onBack={back}
          onGoToStep={goToStep}
        />
      )}
    </div>
  );
}
