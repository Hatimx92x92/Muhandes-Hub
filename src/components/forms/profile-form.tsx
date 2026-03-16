'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfile } from '@/actions/profile';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/forms/phone-input';
import { CitySelect } from '@/components/forms/city-select';
import { Save, User, Building2 } from 'lucide-react';
import type { UserProfile } from '@/hooks/use-auth';

// =============================================================================
// Profile edit form
// =============================================================================

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations('forms.profile');
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  const isCompany = profile.profile_type === 'company';

  return (
    <form action={formAction} className="space-y-6">
      {state?.data?.updated && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          {t('updateSuccess')}
        </div>
      )}

      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Basic info */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {t('basicInfo')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="full_name"
            label={t('fullName')}
            defaultValue={profile.full_name}
            required
            error={state?.error ? state.fieldErrors?.full_name?.[0] : undefined}
          />
          <Input
            name="email"
            label={t('email')}
            defaultValue={profile.email}
            disabled
            dir="ltr"
            hint={t('emailHint')}
          />
          <PhoneInput
            name="phone"
            label={t('phone')}
            defaultValue={profile.phone?.replace('+966', '') || ''}
            error={state?.error ? state.fieldErrors?.phone?.[0] : undefined}
          />
          <CitySelect
            name="city"
            label={t('city')}
            defaultValue={profile.city || ''}
          />
        </div>
      </div>

      {/* Company info (if applicable) */}
      {isCompany && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t('companyInfo')}
          </h3>
          <input type="hidden" name="profile_type" value="company" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="company_name_ar"
              label={t('companyNameAr')}
              defaultValue={profile.company_name_ar || ''}
              error={state?.error ? state.fieldErrors?.company_name_ar?.[0] : undefined}
            />
            <Input
              name="company_name_en"
              label={t('companyNameEn')}
              defaultValue={profile.company_name_en || ''}
              dir="ltr"
              error={state?.error ? state.fieldErrors?.company_name_en?.[0] : undefined}
            />
            <Input
              name="cr_number"
              label={t('crNumber')}
              defaultValue={profile.cr_number || ''}
              dir="ltr"
              error={state?.error ? state.fieldErrors?.cr_number?.[0] : undefined}
            />
            <Input
              name="website"
              label={t('website')}
              type="url"
              defaultValue={profile.website || ''}
              dir="ltr"
              placeholder="https://example.com"
              error={state?.error ? state.fieldErrors?.website?.[0] : undefined}
            />
          </div>
        </div>
      )}

      {!isCompany && <input type="hidden" name="profile_type" value="personal" />}

      {/* Bio */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('bioTitle')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea
            name="bio_ar"
            label={t('bioAr')}
            defaultValue={profile.bio_ar || ''}
            rows={3}
            error={state?.error ? state.fieldErrors?.bio_ar?.[0] : undefined}
          />
          <Textarea
            name="bio_en"
            label={t('bioEn')}
            defaultValue={profile.bio_en || ''}
            rows={3}
            dir="ltr"
            error={state?.error ? state.fieldErrors?.bio_en?.[0] : undefined}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          <Save className="h-4 w-4 me-2" />
          {t('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
