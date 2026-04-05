// =============================================================================
// Profile Page — view and edit profile (with avatar, logo, visibility, docs)
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { ProfileForm } from '@/components/forms/profile-form';
import { CompanyDocuments } from '@/components/features/profile/company-documents';
import { ProfileCompleteness } from '@/components/features/profile/profile-completeness';
import { AvatarUpload } from '@/components/forms/avatar-upload';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getEntitySlug } from '@/lib/utils';
import type { UserProfile } from '@/hooks/use-auth';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profileData } = await db
    .from('profiles')
    .select(
      'id, role, full_name, phone, profile_type, company_name_ar, company_name_en, avatar_url, logo_url, city_id, cr_number, website, bio_ar, bio_en, verification_status, is_admin, slug_ar, slug_en, profile_visibility, social_links, specializations, established_year',
    )
    .eq('id', user.id)
    .single();

  if (!profileData) redirect('/login');

  let subTier = 'starter';
  let subExpires: string | null = null;
  try {
    const { data: subData } = await db
      .from('subscriptions')
      .select('tier, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (subData) {
      subTier = subData.tier;
      subExpires = subData.expires_at;
    }
  } catch {
    // No active subscription
  }

  // Fetch company documents
  const { data: companyDocs } = await db
    .from('company_documents')
    .select('id, display_name, file_url, file_name, file_size, mime_type, created_at')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  const profile: UserProfile = {
    ...profileData,
    email: user.email ?? '',
    city: profileData.city_id,
    subscription_tier: subTier,
    subscription_expires_at: subExpires,
    profile_visibility: profileData.profile_visibility || {},
    social_links: profileData.social_links || {},
    specializations: profileData.specializations || [],
    established_year: profileData.established_year || null,
  };

  const t = await getTranslations('dashboard.profile');
  const locale = await getLocale();

  const profileSlug = getEntitySlug(profile, locale);
  const showPublicProfile =
    profileSlug && (profile.role === 'contractor' || profile.role === 'supplier');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        {showPublicProfile && (
          <Link href={`/partners/${profileSlug}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="me-1.5 h-4 w-4" />
              {t('viewPublicProfile')}
            </Button>
          </Link>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        {t('subtitle')}
      </p>

      {/* Profile completeness */}
      <div className="mb-8">
        <ProfileCompleteness profile={profile} documentsCount={companyDocs?.length || 0} />
      </div>

      {/* Role + verification badges */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Badge variant={profile.role as 'project_owner' | 'contractor' | 'supplier' | 'buyer'}>
          {t(`roles.${profile.role}` as never) || profile.role}
        </Badge>
        <Badge
          variant={profile.verification_status === 'active' ? 'active' : profile.verification_status === 'banned' ? 'destructive' : 'pending'}
        >
          {t(`verification.${profile.verification_status}` as never) || profile.verification_status}
        </Badge>
      </div>

      {/* Avatar + Logo upload */}
      <div className="mb-8 flex items-start gap-6 rounded-xl border border-border bg-card p-6">
        <AvatarUpload
          currentUrl={profile.avatar_url}
          type="avatar"
          size="lg"
        />
        <AvatarUpload
          currentUrl={profile.logo_url}
          type="logo"
          size="lg"
        />
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="font-semibold text-foreground text-lg">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground" dir="ltr">{profile.email}</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <ProfileForm profile={profile} />
      </div>

      {/* Company documents */}
      <div className="rounded-xl border border-border bg-card p-6">
        <CompanyDocuments documents={companyDocs || []} />
      </div>
    </div>
  );
}
