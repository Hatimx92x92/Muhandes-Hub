'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserRole, SubscriptionTier } from '@/types';

// =============================================================================
// User profile shape (subset of profiles table)
// =============================================================================

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  profile_type: 'company' | 'personal';
  company_name_ar: string | null;
  company_name_en: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  city: string | null;
  cr_number: string | null;
  website: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  verification_status: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  is_admin: boolean;
}

// =============================================================================
// useAuth hook — session + profile state
// =============================================================================

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: profileData } = await db
        .from('profiles')
        .select(
          'id, role, full_name, email, phone, profile_type, company_name_ar, company_name_en, avatar_url, logo_url, city, cr_number, website, bio_ar, bio_en, verification_status, is_admin',
        )
        .eq('id', userId)
        .single();

      const { data: subData } = await db
        .from('subscriptions')
        .select('tier, expires_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (profileData) {
        setProfile({
          ...profileData,
          subscription_tier: subData?.tier ?? 'starter',
          subscription_expires_at: subData?.expires_at ?? null,
        });
      } else {
        setProfile(null);
      }
    },
    [supabase],
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin ?? false,
    role: profile?.role ?? null,
  };
}
