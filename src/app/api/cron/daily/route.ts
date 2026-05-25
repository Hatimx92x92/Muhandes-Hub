// =============================================================================
// Muhandes HUB — Daily Cron Job (Consolidated)
// Runs at 11 PM Saudi (20:00 UTC) via Vercel Cron
// Handles: subscription checks, commission checks, CRM follow-up reminders
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  notifySubscriptionExpiring,
  notifySubscriptionExpired,
} from '@/actions/notification-triggers';
import { notifyCommissionOverdue } from '@/actions/notification-triggers';
import { emailFollowUpReminder } from '@/lib/resend/templates';

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

  const results = {
    subscriptions: { warned7Day: 0, warned1Day: 0, expired: 0 },
    commissions: { overdueProcessed: 0 },
    reminders: { processed: 0, emailsSent: 0 },
    timestamp: now.toISOString(),
  };

  // =========================================================================
  // 1. SUBSCRIPTION CHECK
  // =========================================================================

  try {
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 7-day warning (±12 hours window)
    const sevenDayStart = new Date(sevenDaysFromNow.getTime() - 12 * 60 * 60 * 1000);
    const sevenDayEnd = new Date(sevenDaysFromNow.getTime() + 12 * 60 * 60 * 1000);

    const { data: expiring7Day } = await supabase
      .from('subscriptions')
      .select('user_id, tier, expires_at')
      .eq('is_active', true)
      .gte('expires_at', sevenDayStart.toISOString())
      .lte('expires_at', sevenDayEnd.toISOString());

    for (const sub of expiring7Day || []) {
      await notifySubscriptionExpiring({
        userId: sub.user_id,
        daysLeft: 7,
        tier: sub.tier,
      }).catch(() => {});
      results.subscriptions.warned7Day++;
    }

    // 1-day warning (±12 hours window)
    const oneDayStart = new Date(oneDayFromNow.getTime() - 12 * 60 * 60 * 1000);
    const oneDayEnd = new Date(oneDayFromNow.getTime() + 12 * 60 * 60 * 1000);

    const { data: expiring1Day } = await supabase
      .from('subscriptions')
      .select('user_id, tier, expires_at')
      .eq('is_active', true)
      .gte('expires_at', oneDayStart.toISOString())
      .lte('expires_at', oneDayEnd.toISOString());

    for (const sub of expiring1Day || []) {
      await notifySubscriptionExpiring({
        userId: sub.user_id,
        daysLeft: 1,
        tier: sub.tier,
      }).catch(() => {});
      results.subscriptions.warned1Day++;
    }

    // Handle expired subscriptions — downgrade to starter
    const { data: expiredSubs } = await supabase
      .from('subscriptions')
      .select('id, user_id, tier')
      .eq('is_active', true)
      .lt('expires_at', now.toISOString());

    for (const sub of expiredSubs || []) {
      await supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('id', sub.id);

      await notifySubscriptionExpired({
        userId: sub.user_id,
        tier: sub.tier,
      }).catch(() => {});

      results.subscriptions.expired++;
    }
  } catch (err) {
    console.error('Subscription check error:', err);
  }

  // =========================================================================
  // 2. COMMISSION CHECK
  // =========================================================================

  try {
    const { data: overdue } = await supabase
      .from('commissions')
      .select('id, seller_id, total, due_date, status')
      .eq('status', 'pending')
      .lt('due_date', now.toISOString());

    for (const commission of overdue || []) {
      const dueDate = new Date(commission.due_date);
      const daysOverdue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      await supabase
        .from('commissions')
        .update({ status: 'overdue' })
        .eq('id', commission.id);

      await notifyCommissionOverdue({
        sellerId: commission.seller_id,
        amount: commission.total,
        daysOverdue,
        commissionId: commission.id,
      }).catch(() => {});

      // Restrict account if 30+ days overdue
      if (daysOverdue >= 30) {
        await supabase
          .from('profiles')
          .update({ is_restricted: true })
          .eq('id', commission.seller_id);
      }

      results.commissions.overdueProcessed++;
    }
  } catch (err) {
    console.error('Commission check error:', err);
  }

  // =========================================================================
  // 3. CRM FOLLOW-UP REMINDERS
  // =========================================================================

  try {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: reminders } = await supabase
      .from('crm_follow_up_reminders')
      .select('id, owner_id, client_id, note, reminder_date')
      .eq('is_completed', false)
      .gte('reminder_date', todayStart.toISOString())
      .lte('reminder_date', todayEnd.toISOString());

    results.reminders.processed = reminders?.length ?? 0;

    for (const reminder of reminders || []) {
      const { data: owner } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', reminder.owner_id)
        .single();

      if (!owner?.email) continue;

      const { data: client } = await supabase
        .from('crm_clients')
        .select('name, slug')
        .eq('id', reminder.client_id)
        .single();

      if (!client) continue;

      const clientPath = `/dashboard/crm/${client.slug || reminder.client_id}`;

      await emailFollowUpReminder(
        owner.email,
        client.name,
        reminder.note,
        clientPath
      ).catch(() => {});

      results.reminders.emailsSent++;
    }
  } catch (err) {
    console.error('Reminder check error:', err);
  }

  return NextResponse.json({ success: true, ...results });
}
