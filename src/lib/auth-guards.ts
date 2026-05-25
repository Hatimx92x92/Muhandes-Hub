// =============================================================================
// Muhandes HUB — Server-Side Role Guards for Dashboard Pages
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

interface RequireRoleResult {
  user: User;
  profile: { role: UserRole; [key: string]: unknown };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Server-side role guard for dashboard pages.
 * Fetches auth user + profile, validates role membership.
 * Redirects to `/dashboard` if the user's role is not in `allowedRoles`.
 * Returns `{ user, profile, supabase }` for reuse by the page.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<RequireRoleResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile?.role as UserRole) ?? 'buyer';

  if (!allowedRoles.includes(role)) {
    redirect('/dashboard');
  }

  return {
    user,
    profile: { ...profile, role },
    supabase,
  };
}
