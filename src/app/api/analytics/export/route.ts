// =============================================================================
// API Route — Export Analytics as CSV
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TIER_LIMITS } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check tier — only Business+/PO can export
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = subscription?.tier ?? 'starter';
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.starter;
  const role = profile?.role ?? '';
  const isAdvanced = limits.hasAnalytics === 'full' || role === 'project_owner';

  if (!isAdvanced) {
    return NextResponse.json({ error: 'Upgrade to Business or higher to export analytics' }, { status: 403 });
  }

  // Fetch deals
  const { data: deals } = await db(supabase)
    .from('deals')
    .select('id, deal_type, status, value, commission_amount, created_at')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (!deals || deals.length === 0) {
    const emptyCSV = 'ID,Type,Status,Value (SAR),Commission (SAR),Created\n';
    return new NextResponse(emptyCSV, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Build CSV
  const header = 'ID,Type,Status,Value (SAR),Commission (SAR),Created\n';
  const rows = (deals as Record<string, unknown>[]).map(d => {
    const id = String(d.id ?? '').slice(0, 8);
    const type = String(d.deal_type ?? '');
    const status = String(d.status ?? '');
    const value = Number(d.value ?? 0).toFixed(2);
    const commission = Number(d.commission_amount ?? 0).toFixed(2);
    const created = d.created_at ? new Date(d.created_at as string).toISOString().slice(0, 10) : '';
    return `${id},${type},${status},${value},${commission},${created}`;
  }).join('\n');

  const csv = header + rows;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
