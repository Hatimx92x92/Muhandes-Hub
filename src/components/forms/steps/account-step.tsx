'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/forms/phone-input';
import { Checkbox } from '@/components/ui/checkbox';
import { RegisterStep2Schema, OAuthAccountSchema } from '@/schemas/auth';
import type { WizardData } from '../register-wizard';

// =============================================================================
// Step 2: Account Details — name, email, password, phone, PDPL consent
// =============================================================================

interface AccountStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  fieldErrors: Record<string, string[]>;
  isOAuthMode?: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function AccountStep({ data, updateData, fieldErrors, isOAuthMode = false, onNext, onBack }: AccountStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = useTranslations('auth.accountStep');
  const tc = useTranslations('common');

  const handleNext = () => {
    const result = isOAuthMode
      ? OAuthAccountSchema.safeParse({
          full_name: data.full_name,
          phone: data.phone,
          pdpl_consent: data.pdpl_consent,
        })
      : RegisterStep2Schema.safeParse({
          full_name: data.full_name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          pdpl_consent: data.pdpl_consent,
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

      <Input
        label={t('fullName')}
        name="full_name"
        value={data.full_name}
        onChange={(e) => updateData({ full_name: e.target.value })}
        error={getError('full_name')}
        placeholder="أدخل اسمك الكامل"
      />

      <Input
        label={t('email')}
        name="email"
        type="email"
        dir="ltr"
        value={data.email}
        onChange={(e) => !isOAuthMode && updateData({ email: e.target.value })}
        error={getError('email')}
        placeholder="email@example.com"
        readOnly={isOAuthMode}
        className={isOAuthMode ? 'opacity-60 cursor-not-allowed' : ''}
      />

      {!isOAuthMode && (
        <PasswordInput
          label={t('password')}
          name="password"
          dir="ltr"
          value={data.password}
          onChange={(e) => updateData({ password: e.target.value })}
          error={getError('password')}
          placeholder="••••••••"
          hint={t('passwordHint')}
        />
      )}

      <PhoneInput
        label={t('phone')}
        name="phone"
        value={data.phone}
        onChange={(e) => updateData({ phone: e.target.value })}
        error={getError('phone')}
      />

      {/* PDPL Consent */}
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={data.pdpl_consent}
          onCheckedChange={(v) => updateData({ pdpl_consent: v })}
          className="mt-1"
        />
        <span className="text-sm text-muted-foreground leading-relaxed">
          {t('pdplConsent')}{' '}
          <a href="/terms" className="text-primary hover:underline" target="_blank">
            {t('pdplTerms')}
          </a>{' '}
          {t('pdplAnd')}{' '}
          <a href="/privacy" className="text-primary hover:underline" target="_blank">
            {t('pdplPrivacy')}
          </a>{' '}
          {t('pdplSuffix')}
        </span>
      </label>
      {getError('pdpl_consent') && (
        <p className="text-sm text-destructive">{getError('pdpl_consent')}</p>
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
