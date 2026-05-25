import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { AdminMessagesClient } from './admin-messages-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminMessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const currentLocale = await getLocale();
  const adminClient = createAdminClient();

  // Fetch conversation IDs the admin participates in
  const { data: participations } = await db(supabase)
    .from('conversation_participants')
    .select('conversation_id, unread_count')
    .eq('user_id', user.id);

  const myConvIds = (participations ?? []).map((p: { conversation_id: string }) => p.conversation_id);

  if (myConvIds.length === 0) {
    return <AdminMessagesClient conversations={[]} />;
  }

  // Fetch conversation metadata + other participant profiles + last messages in parallel
  const [convsResult, otherParticipantsResult, lastMessagesResult] = await Promise.all([
    db(adminClient)
      .from('conversations')
      .select('id, updated_at')
      .in('id', myConvIds)
      .order('updated_at', { ascending: false })
      .limit(50),
    db(adminClient)
      .from('conversation_participants')
      .select('conversation_id, user_id, profiles(full_name, company_name_ar, company_name_en)')
      .in('conversation_id', myConvIds)
      .neq('user_id', user.id),
    db(adminClient)
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', myConvIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const unreadMap = new Map(
    (participations ?? []).map((p: { conversation_id: string; unread_count: number }) => [
      p.conversation_id,
      p.unread_count,
    ]),
  );

  // First matching participant per conversation (skip admin's own row)
  const participantMap = new Map<string, { full_name: string; company_name_ar: string | null; company_name_en: string | null }>();
  for (const p of (otherParticipantsResult.data ?? []) as { conversation_id: string; profiles: { full_name: string; company_name_ar: string | null; company_name_en: string | null } | null }[]) {
    if (!participantMap.has(p.conversation_id)) {
      participantMap.set(p.conversation_id, p.profiles ?? { full_name: 'Unknown', company_name_ar: null, company_name_en: null });
    }
  }

  // Last message per conversation (results already ordered desc, first match wins)
  const lastMessageMap = new Map<string, string>();
  for (const msg of (lastMessagesResult.data ?? []) as { conversation_id: string; content: string }[]) {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, msg.content);
    }
  }

  const conversations = (convsResult.data ?? []).map((conv: { id: string; updated_at: string }) => {
    const participant = participantMap.get(conv.id);
    const company = currentLocale === 'ar' ? participant?.company_name_ar : participant?.company_name_en;
    return {
      id: conv.id,
      updated_at: conv.updated_at,
      lastMessageContent: lastMessageMap.get(conv.id) ?? null,
      unreadCount: unreadMap.get(conv.id) ?? 0,
      participantName: participant?.full_name ?? `#${conv.id.slice(0, 8)}`,
      participantCompany: company ?? null,
    };
  });

  return <AdminMessagesClient conversations={conversations} />;
}
