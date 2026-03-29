// =============================================================================
// Muhandes HUB — Commission Overdue Check (Cron Endpoint)
// Call via Vercel Cron daily — marks overdue commissions and sends reminders
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyCommissionOverdue } from '@/actions/notification-triggers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

  // Find pending commissions past their due date
  const { data: overdue } = await supabase
    .from('commissions')
    .select('id, seller_id, total, due_date, status')
    .eq('status', 'pending')
    .lt('due_date', now.toISOString());

  let updated = 0;

  for (const commission of overdue || []) {
    const dueDate = new Date(commission.due_date);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Mark as overdue
    await supabase
      .from('commissions')
      .update({ status: 'overdue' })
      .eq('id', commission.id);

    // Send reminder notification
    await notifyCommissionOverdue({
      sellerId: commission.seller_id,
      amount: commission.total,
      daysOverdue,
      commissionId: commission.id,
    }).catch(() => {});

    // If 30+ days overdue, restrict the seller's account
    if (daysOverdue >= 30) {
      await supabase
        .from('profiles')
        .update({ is_restricted: true })
        .eq('id', commission.seller_id);
    }

    updated++;
  }

  return NextResponse.json({
    success: true,
    overdueProcessed: updated,
    timestamp: now.toISOString(),
  });
}
