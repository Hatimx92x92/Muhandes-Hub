// =============================================================================
// Kanban Board Page — Server Component (per-deal)
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanBoard } from '@/components/features/kanban/kanban-board';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');

  // Verify deal exists and user is a participant
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('id, deal_type, status, buyer_id, seller_id')
    .eq('id', dealId)
    .single();

  if (!deal) notFound();

  // Check role
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single();

  // Kanban requires contractor role + Pro+ tier
  if (profile?.role !== 'contractor') {
    return (
      <div className="space-y-4">
        <Link href={`/dashboard/deals/${dealId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {t('backToDeal')}
        </Link>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{t('kanbanContractorsOnly')}</p>
        </Card>
      </div>
    );
  }

  const tier = (profile?.subscription_tier as string) || 'starter';
  if (tier === 'starter') {
    return (
      <div className="space-y-4">
        <Link href={`/dashboard/deals/${dealId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {t('backToDeal')}
        </Link>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{t('kanbanProOnly')}</p>
          <Link href="/dashboard/subscription" className="text-sm text-primary hover:underline mt-2 inline-block">
            {t('upgradeSubscription')}
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch columns with cards
  const { data: columns } = await db(supabase)
    .from('kanban_columns')
    .select('*, kanban_cards(*)')
    .eq('deal_id', dealId)
    .order('sort_order', { ascending: true });

  // If no columns, show initialization prompt
  const hasColumns = columns && columns.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{t('kanban')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('dealColon')} {deal.deal_type as string}
            <Badge variant={deal.status === 'active' ? 'active' : 'completed'} className="ms-2">
              {deal.status as string}
            </Badge>
          </p>
        </div>
        <Link
          href={`/dashboard/deals/${dealId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t('backToDeal')}
        </Link>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        dealId={dealId}
        columns={(columns || []).map((col: Record<string, unknown>) => ({
          id: col.id as string,
          name: col.name as string,
          sort_order: col.sort_order as number,
          cards: ((col.kanban_cards as Array<Record<string, unknown>>) || [])
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
              (a.sort_order as number) - (b.sort_order as number)
            )
            .map((card: Record<string, unknown>) => ({
              id: card.id as string,
              title: card.title as string,
              description: (card.description as string) || '',
              assignee_name: (card.assignee_name as string) || '',
              due_date: (card.due_date as string) || '',
              priority: (card.priority as string) || 'medium',
            })),
        }))}
        hasColumns={!!hasColumns}
        tier={tier}
      />
    </div>
  );
}
