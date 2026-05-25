// =============================================================================
// Muhandes HUB — Admin Analytics Actions
// =============================================================================

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

async function verifyAdmin(): Promise<{ adminId: string } | { error: string }> {
  const t = await getTranslations('actions.adminContact');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: t('mustLogin') };

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return { error: t('adminOnly') };
  return { adminId: user.id };
}

// ---------------------------------------------------------------------------
// GET PLATFORM ANALYTICS
// ---------------------------------------------------------------------------
export async function getPlatformAnalytics(): Promise<ActionResult<{
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  subscriptionsByTier: Record<string, number>;
  recentSignups: { date: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
  totals: {
    totalUsers: number;
    activeUsers: number;
    totalDeals: number;
    totalProjects: number;
    totalProducts: number;
    totalBids: number;
    totalRevenue: number;
    newUsersThisMonth: number;
  };
}>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Run all queries in parallel
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalDeals },
    { count: totalProjects },
    { count: totalProducts },
    { count: totalBids },
    { data: roleData },
    { data: statusData },
    { data: tierData },
    { data: recentUsers },
    { data: subscriptionsData },
  ] = await Promise.all([
    db(adminClient).from('profiles').select('id', { count: 'exact' }),
    db(adminClient).from('profiles').select('id', { count: 'exact' }).eq('verification_status', 'active'),
    db(adminClient).from('deals').select('id', { count: 'exact' }),
    db(adminClient).from('projects').select('id', { count: 'exact' }),
    db(adminClient).from('products').select('id', { count: 'exact' }),
    db(adminClient).from('bids').select('id', { count: 'exact' }),
    db(adminClient).from('profiles').select('role'),
    db(adminClient).from('profiles').select('verification_status'),
    db(adminClient).from('subscriptions').select('tier').eq('is_active', true),
    db(adminClient).from('profiles').select('created_at').order('created_at', { ascending: false }).limit(200),
    db(adminClient).from('subscriptions').select('final_price, created_at').eq('is_active', true),
  ]);

  // Count users by role
  const usersByRole: Record<string, number> = {};
  for (const row of (roleData ?? []) as { role: string }[]) {
    usersByRole[row.role] = (usersByRole[row.role] ?? 0) + 1;
  }

  // Count users by status
  const usersByStatus: Record<string, number> = {};
  for (const row of (statusData ?? []) as { verification_status: string }[]) {
    usersByStatus[row.verification_status] = (usersByStatus[row.verification_status] ?? 0) + 1;
  }

  // Count subscriptions by tier
  const subscriptionsByTier: Record<string, number> = {};
  for (const row of (tierData ?? []) as { tier: string }[]) {
    subscriptionsByTier[row.tier] = (subscriptionsByTier[row.tier] ?? 0) + 1;
  }

  // Compute recent signups (last 30 days, grouped by date)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSignups: { date: string; count: number }[] = [];
  const signupMap = new Map<string, number>();
  for (const row of (recentUsers ?? []) as { created_at: string }[]) {
    const d = new Date(row.created_at);
    if (d >= thirtyDaysAgo) {
      const key = d.toISOString().slice(0, 10);
      signupMap.set(key, (signupMap.get(key) ?? 0) + 1);
    }
  }
  for (const [date, count] of signupMap.entries()) {
    recentSignups.push({ date, count });
  }
  recentSignups.sort((a, b) => a.date.localeCompare(b.date));

  // Compute revenue by month
  const revenueMap = new Map<string, number>();
  let totalRevenue = 0;
  for (const row of (subscriptionsData ?? []) as { final_price: number; created_at: string }[]) {
    const amount = Number(row.final_price ?? 0);
    totalRevenue += amount;
    const month = new Date(row.created_at).toISOString().slice(0, 7);
    revenueMap.set(month, (revenueMap.get(month) ?? 0) + amount);
  }
  const revenueByMonth: { month: string; amount: number }[] = [];
  for (const [month, amount] of revenueMap.entries()) {
    revenueByMonth.push({ month, amount });
  }
  revenueByMonth.sort((a, b) => a.month.localeCompare(b.month));

  // New users this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newUsersThisMonth = (recentUsers ?? []).filter(
    (u: { created_at: string }) => new Date(u.created_at) >= startOfMonth,
  ).length;

  return {
    data: {
      usersByRole,
      usersByStatus,
      subscriptionsByTier,
      recentSignups,
      revenueByMonth,
      totals: {
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        totalDeals: totalDeals ?? 0,
        totalProjects: totalProjects ?? 0,
        totalProducts: totalProducts ?? 0,
        totalBids: totalBids ?? 0,
        totalRevenue,
        newUsersThisMonth,
      },
    },
    error: null,
  };
}
