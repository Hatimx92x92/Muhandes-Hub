// =============================================================================
// Muhandes HUB — CRM Follow-Up Reminder Check (Cron Endpoint)
// Call via Vercel Cron or external scheduler once daily
// Sends email reminders for CRM follow-ups due today
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

  // Find reminders due today (not completed)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: reminders } = await supabase
    .from('crm_follow_up_reminders')
    .select('id, owner_id, client_id, note, reminder_date')
    .eq('is_completed', false)
    .gte('reminder_date', todayStart.toISOString())
    .lte('reminder_date', todayEnd.toISOString());

  let sent = 0;

  for (const reminder of reminders || []) {
    // Get owner email
    const { data: owner } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', reminder.owner_id)
      .single();

    if (!owner?.email) continue;

    // Get client name + slug for the link
    const { data: client } = await supabase
      .from('crm_clients')
      .select('name, slug')
      .eq('id', reminder.client_id)
      .single();

    if (!client) continue;

    const clientPath = `/dashboard/crm/${client.slug || reminder.client_id}`;

    await emailFollowUpReminder(owner.email, client.name, reminder.note, clientPath).catch(() => {});
    sent++;
  }

  return NextResponse.json({
    ok: true,
    remindersProcessed: reminders?.length ?? 0,
    emailsSent: sent,
  });
}
