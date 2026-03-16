// =============================================================================
// Muqawil HUB — Subscription Expiry Check (Cron Endpoint)
// Call via Vercel Cron or external scheduler once daily
// Sends 7-day and 1-day warnings, and handles expired subscriptions
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  notifySubscriptionExpiring,
  notifySubscriptionExpired,
} from '@/actions/notification-triggers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing config' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let warned7Day = 0;
  let warned1Day = 0;
  let expired = 0;

  // 1. Find subscriptions expiring in 7 days (±12 hours window)
  const sevenDayStart = new Date(sevenDaysFromNow.getTime() - 12 * 60 * 60 * 1000);
  const sevenDayEnd = new Date(sevenDaysFromNow.getTime() + 12 * 60 * 60 * 1000);

  const { data: expiring7Day } = await supabase
    .from('subscriptions')
    .select('user_id, tier, expires_at')
    .eq('status', 'active')
    .gte('expires_at', sevenDayStart.toISOString())
    .lte('expires_at', sevenDayEnd.toISOString());

  for (const sub of expiring7Day || []) {
    await notifySubscriptionExpiring({
      userId: sub.user_id,
      daysLeft: 7,
      tier: sub.tier,
    }).catch(() => {});
    warned7Day++;
  }

  // 2. Find subscriptions expiring in 1 day (±12 hours window)
  const oneDayStart = new Date(oneDayFromNow.getTime() - 12 * 60 * 60 * 1000);
  const oneDayEnd = new Date(oneDayFromNow.getTime() + 12 * 60 * 60 * 1000);

  const { data: expiring1Day } = await supabase
    .from('subscriptions')
    .select('user_id, tier, expires_at')
    .eq('status', 'active')
    .gte('expires_at', oneDayStart.toISOString())
    .lte('expires_at', oneDayEnd.toISOString());

  for (const sub of expiring1Day || []) {
    await notifySubscriptionExpiring({
      userId: sub.user_id,
      daysLeft: 1,
      tier: sub.tier,
    }).catch(() => {});
    warned1Day++;
  }

  // 3. Handle expired subscriptions — downgrade to starter
  const { data: expiredSubs } = await supabase
    .from('subscriptions')
    .select('id, user_id, tier')
    .eq('status', 'active')
    .lt('expires_at', now.toISOString());

  for (const sub of expiredSubs || []) {
    // Mark subscription as expired
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', sub.id);

    // Downgrade profile to starter
    await supabase
      .from('profiles')
      .update({ subscription_tier: 'starter' })
      .eq('id', sub.user_id);

    // Notify user
    await notifySubscriptionExpired({
      userId: sub.user_id,
      tier: sub.tier,
    }).catch(() => {});

    expired++;
  }

  return NextResponse.json({
    success: true,
    warned7Day,
    warned1Day,
    expired,
    timestamp: now.toISOString(),
  });
}
