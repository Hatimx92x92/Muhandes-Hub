'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfile } from '@/actions/profile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BilingualFieldPair } from '@/components/ui/bilingual-field-pair';
import { PhoneInput } from '@/components/forms/phone-input';
import { CitySelect } from '@/components/forms/city-select';
import { Save, User, Building2, Eye, Share2, Wrench, CalendarDays } from 'lucide-react';
import { SPECIALIZATION_OPTIONS } from '@/schemas/profile';
import { cn } from '@/lib/utils';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { UserProfile } from '@/hooks/use-auth';

// =============================================================================
// Profile edit form — with visibility, social links, specializations, year
// =============================================================================

interface ProfileFormProps {
  profile: UserProfile;
}

// Simple toggle switch component
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-muted-foreground/25',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </label>
  );
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations('forms.profile');
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  const isCompany = profile.profile_type === 'company';

  // Visibility state — default all to true (visible)
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    phone: profile.profile_visibility?.phone !== false,
    website: profile.profile_visibility?.website !== false,
    cr_number: profile.profile_visibility?.cr_number !== false,
    bio: profile.profile_visibility?.bio !== false,
    city: profile.profile_visibility?.city !== false,
    company_name: profile.profile_visibility?.company_name !== false,
    established_year: profile.profile_visibility?.established_year !== false,
    social_links: profile.profile_visibility?.social_links !== false,
    specializations: profile.profile_visibility?.specializations !== false,
    documents: profile.profile_visibility?.documents !== false,
  });

  // Social links state
  const [socialLinks, setSocialLinks] = useState({
    linkedin: profile.social_links?.linkedin || '',
    twitter: profile.social_links?.twitter || '',
    instagram: profile.social_links?.instagram || '',
  });

  // Specializations state
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    profile.specializations || [],
  );

  const toggleSpec = (spec: string) => {
    setSelectedSpecs(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec],
    );
  };

  return (
    <form action={(fd) => {
      // Inject JSON fields into FormData
      fd.set('visibility', JSON.stringify(visibility));
      fd.set('social_links', JSON.stringify(socialLinks));
      fd.set('specializations', JSON.stringify(selectedSpecs));
      formAction(fd);
    }} className="space-y-8">
      {state?.data?.updated && (
        <AlertBanner variant="success">{t('updateSuccess')}</AlertBanner>
      )}

      {state?.error && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
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
          <BilingualFieldPair
            baseName="company_name"
            labelAr={t('companyNameAr')}
            labelEn={t('companyNameEn')}
            defaultValueAr={profile.company_name_ar || ''}
            defaultValueEn={profile.company_name_en || ''}
            errorAr={state?.error ? state.fieldErrors?.company_name_ar?.[0] : undefined}
            errorEn={state?.error ? state.fieldErrors?.company_name_en?.[0] : undefined}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
        <BilingualFieldPair
          baseName="bio"
          type="textarea"
          rows={3}
          labelAr={t('bioAr')}
          labelEn={t('bioEn')}
          defaultValueAr={profile.bio_ar || ''}
          defaultValueEn={profile.bio_en || ''}
          errorAr={state?.error ? state.fieldErrors?.bio_ar?.[0] : undefined}
          errorEn={state?.error ? state.fieldErrors?.bio_en?.[0] : undefined}
        />
      </div>

      {/* Established Year */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t('establishedYear')}
        </h3>
        <div className="max-w-xs">
          <Input
            name="established_year"
            label={t('establishedYearLabel')}
            type="number"
            defaultValue={profile.established_year?.toString() || ''}
            placeholder="2015"
            min={1900}
            max={new Date().getFullYear()}
            dir="ltr"
          />
        </div>
      </div>

      {/* Social Links */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          {t('socialLinksTitle')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="LinkedIn"
            value={socialLinks.linkedin}
            onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
            placeholder="https://linkedin.com/in/..."
            dir="ltr"
          />
          <Input
            label="X (Twitter)"
            value={socialLinks.twitter}
            onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
            placeholder="https://x.com/..."
            dir="ltr"
          />
          <Input
            label="Instagram"
            value={socialLinks.instagram}
            onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
            placeholder="https://instagram.com/..."
            dir="ltr"
          />
        </div>
      </div>

      {/* Specializations */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          {t('specializationsTitle')}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{t('specializationsHint')}</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATION_OPTIONS.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => toggleSpec(spec)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors border',
                selectedSpecs.includes(spec)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground',
              )}
            >
              {t(`specializations.${spec}` as never)}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy / Visibility Settings */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          {t('visibilityTitle')}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{t('visibilityHint')}</p>
        <div className="rounded-lg border border-border bg-background p-4 space-y-1 max-w-md">
          <ToggleSwitch
            checked={visibility.company_name}
            onChange={(v) => setVisibility(prev => ({ ...prev, company_name: v }))}
            label={t('visibilityCompanyName')}
          />
          <ToggleSwitch
            checked={visibility.phone}
            onChange={(v) => setVisibility(prev => ({ ...prev, phone: v }))}
            label={t('visibilityPhone')}
          />
          <ToggleSwitch
            checked={visibility.website}
            onChange={(v) => setVisibility(prev => ({ ...prev, website: v }))}
            label={t('visibilityWebsite')}
          />
          <ToggleSwitch
            checked={visibility.cr_number}
            onChange={(v) => setVisibility(prev => ({ ...prev, cr_number: v }))}
            label={t('visibilityCrNumber')}
          />
          <ToggleSwitch
            checked={visibility.bio}
            onChange={(v) => setVisibility(prev => ({ ...prev, bio: v }))}
            label={t('visibilityBio')}
          />
          <ToggleSwitch
            checked={visibility.city}
            onChange={(v) => setVisibility(prev => ({ ...prev, city: v }))}
            label={t('visibilityCity')}
          />
          <ToggleSwitch
            checked={visibility.established_year}
            onChange={(v) => setVisibility(prev => ({ ...prev, established_year: v }))}
            label={t('visibilityEstablishedYear')}
          />
          <ToggleSwitch
            checked={visibility.social_links}
            onChange={(v) => setVisibility(prev => ({ ...prev, social_links: v }))}
            label={t('visibilitySocialLinks')}
          />
          <ToggleSwitch
            checked={visibility.specializations}
            onChange={(v) => setVisibility(prev => ({ ...prev, specializations: v }))}
            label={t('visibilitySpecializations')}
          />
          <ToggleSwitch
            checked={visibility.documents}
            onChange={(v) => setVisibility(prev => ({ ...prev, documents: v }))}
            label={t('visibilityDocuments')}
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
