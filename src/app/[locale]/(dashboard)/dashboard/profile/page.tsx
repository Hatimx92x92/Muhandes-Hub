// =============================================================================
// Profile Page — view and edit profile
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { ProfileForm } from '@/components/forms/profile-form';
import type { UserProfile } from '@/hooks/use-auth';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch full profile
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (f: string, v: string) => {
          single: () => Promise<{ data: UserProfile | null }>;
        };
      };
    };
  };

  const { data: profile } = await db
    .from('profiles')
    .select(
      'id, role, full_name, email, phone, profile_type, company_name_ar, company_name_en, avatar_url, logo_url, city, cr_number, website, bio_ar, bio_en, verification_status, subscription_tier, subscription_expires_at, is_admin',
    )
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const t = await getTranslations('dashboard.profile');
  const locale = await getLocale();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t('subtitle')}
      </p>

      {/* Role + verification badges */}
      <div className="flex flex-wrap gap-3 mb-8">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {t(`roles.${profile.role}` as never) || profile.role}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            profile.verification_status === 'active'
              ? 'bg-status-active/10 text-status-active'
              : profile.verification_status === 'banned'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-status-pending/10 text-status-pending'
          }`}
        >
          {t(`verification.${profile.verification_status}` as never) || profile.verification_status}
        </span>
      </div>

      {/* Avatar placeholder */}
      <div className="mb-8 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
          {profile.full_name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="font-semibold text-foreground">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground" dir="ltr">{profile.email}</p>
          {/* TODO: Avatar upload with Supabase Storage */}
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
