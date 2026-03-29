// =============================================================================
// Kanban Board Page — Server Component (per-deal)
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanBoard } from '@/components/features/kanban/kanban-board';
import { getTranslations } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { TierGate } from '@/components/features/tier-gate';
import { isUUID } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');
  const tGate = await getTranslations('tierGate');

  // Resolve deal by UUID or title_slug
  let deal;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('deals').select('id, deal_type, status, buyer_id, seller_id').eq('id', slug).single();
    deal = data;
  } else {
    const { data } = await db(supabase).from('deals').select('id, deal_type, status, buyer_id, seller_id').eq('title_slug', slug).single();
    deal = data;
  }

  if (!deal) notFound();

  const dealId = deal.id as string;
  const displaySlug = slug;

  // Check role
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Check role — contractor gets full access, PO gets read-only
  const isReadOnly = profile?.role !== 'contractor';

  // Must be a deal participant (buyer or seller)
  if (user.id !== deal.buyer_id && user.id !== deal.seller_id) {
    return (
      <div className="space-y-4">
        <Card className="p-12 text-center">
        </Card>
      </div>
    );
  }

  const { data: contractorSub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (contractorSub?.tier as string) || 'starter';
  if (tier === 'starter' && !isReadOnly) {
    return (
      <TierGate
        isLocked
        title={tGate('hasKanban.title')}
        description={tGate('hasKanban.description')}
        upgradeLabel={tGate('upgrade')}
      />
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
      <BreadcrumbOverride segment={displaySlug} label={`#${dealId.slice(0, 8)}`} />
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
      </div>

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
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
