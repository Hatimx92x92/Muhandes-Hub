// =============================================================================
// Dashboard — Bid Comparison Page (Project Owner)
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSAR } from '@/lib/utils';
import { BidActions } from '@/components/features/bid-actions';
import { ArrowRight, Trophy, Clock, Banknote, Users, Star, Shield } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const BID_STATUS_VARIANT: Record<string, string> = {
  pending: 'warning',
  shortlisted: 'info',
  awarded: 'success',
  rejected: 'destructive',
};

export default async function BidComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify project ownership
  const { data: project } = await db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, owner_id, status, budget_min, budget_max')
    .eq('id', projectId)
    .single();

  if (!project) notFound();
  if (project.owner_id !== user.id) {
    const tCommon = await getTranslations('dashboard.common');
    const tBids = await getTranslations('dashboard.bids');
    return (
      <div className="py-12 text-center">
        <Card className="mx-auto max-w-md p-8">
          <h1 className="text-xl font-bold text-foreground">{tCommon('unauthorized')}</h1>
          <p className="mt-2 text-muted-foreground">{tBids('cantViewOthersBids')}</p>
        </Card>
      </div>
    );
  }

  // Fetch all bids on this project with contractor profiles
  const { data: bids } = await db(supabase)
    .from('bids')
    .select('id, contractor_id, amount, timeline_days, methodology_ar, methodology_en, status, submitted_at')
    .eq('project_id', projectId)
    .order('submitted_at', { ascending: true });

  // Fetch contractor profiles separately
  const contractorIds = (bids ?? []).map((b: { contractor_id: string }) => b.contractor_id);
  let contractors: Record<string, { full_name: string; company_name_ar: string; subscription_tier: string; classification: string }> = {};
  if (contractorIds.length > 0) {
    const { data: profiles } = await db(supabase)
      .from('profiles')
      .select('id, full_name, company_name_ar')
      .in('id', contractorIds);

    // Get subscription tiers for contractors
    const { data: subs } = await db(supabase)
      .from('subscriptions')
      .select('user_id, tier')
      .in('user_id', contractorIds)
      .eq('is_active', true);

    const subMap: Record<string, string> = {};
    if (subs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of subs as any[]) {
        subMap[s.user_id] = s.tier;
      }
    }

    if (profiles) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of profiles as any[]) {
        contractors[p.id] = {
          ...p,
          subscription_tier: subMap[p.id] || 'starter',
          classification: '',
        };
      }
    }
  }

  // Find best values for highlighting
  const amounts = (bids ?? []).map((b: { amount: number }) => b.amount);
  const timelines = (bids ?? []).map((b: { timeline_days: number }) => b.timeline_days);
  const lowestAmount = amounts.length ? Math.min(...amounts) : 0;
  const shortestTimeline = timelines.length ? Math.min(...timelines) : 0;

  const hasPendingOrShortlisted = (bids ?? []).some(
    (b: { status: string }) => b.status === 'pending' || b.status === 'shortlisted'
  );

  const tBids = await getTranslations('dashboard.bids');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          {tBids('backToProjectDetails')}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{tBids('submittedBids')}</h1>
        <p className="mt-1 text-muted-foreground">{project.title_ar}</p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <Users className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="mt-1 text-2xl font-bold">{bids?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground">{tBids('totalBids')}</div>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="mx-auto h-5 w-5 text-status-pending" />
          <div className="mt-1 text-2xl font-bold">
            {(bids ?? []).filter((b: { status: string }) => b.status === 'pending').length}
          </div>
          <div className="text-xs text-muted-foreground">{tCommon('pending')}</div>
        </Card>
        <Card className="p-4 text-center">
          <Star className="mx-auto h-5 w-5 text-primary" />
          <div className="mt-1 text-2xl font-bold">
            {(bids ?? []).filter((b: { status: string }) => b.status === 'shortlisted').length}
          </div>
          <div className="text-xs text-muted-foreground">{tBids('shortlisted')}</div>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="mx-auto h-5 w-5 text-status-completed" />
          <div className="mt-1 text-2xl font-bold">
            {(bids ?? []).filter((b: { status: string }) => b.status === 'awarded').length}
          </div>
          <div className="text-xs text-muted-foreground">{tCommon('awarded')}</div>
        </Card>
      </div>

      {/* Comparison Table */}
      {bids && bids.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="py-3 ps-4 pe-2 text-start font-medium text-muted-foreground">{tBids('contractor')}</th>
                  <th className="px-2 py-3 text-start font-medium text-muted-foreground">{tBids('amount')}</th>
                  <th className="px-2 py-3 text-start font-medium text-muted-foreground">{tCommon('duration')}</th>
                  <th className="px-2 py-3 text-start font-medium text-muted-foreground">{tBids('classification')}</th>
                  <th className="px-2 py-3 text-start font-medium text-muted-foreground">{tBids('tier')}</th>
                  <th className="px-2 py-3 text-start font-medium text-muted-foreground">{tCommon('status')}</th>
                  <th className="py-3 ps-2 pe-4 text-start font-medium text-muted-foreground">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {bids.map((bid: any) => {
                  const contractor = contractors[bid.contractor_id];
                  const statusVariant = BID_STATUS_VARIANT[bid.status] || BID_STATUS_VARIANT.pending;
                  const isBestPrice = bid.amount === lowestAmount;
                  const isFastest = bid.timeline_days === shortestTimeline;

                  return (
                    <tr key={bid.id} className="border-b border-border/50 hover:bg-muted/30">
                      {/* Contractor */}
                      <td className="py-3 ps-4 pe-2">
                        <div className="font-medium text-foreground">
                          {contractor?.company_name_ar || contractor?.full_name || '—'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-foreground">{formatSAR(bid.amount)}</span>
                          {isBestPrice && bids.length > 1 && (
                            <Badge variant="success" className="text-[10px]">{tBids('lowest')}</Badge>
                          )}
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-foreground">{bid.timeline_days} {tCommon('day')}</span>
                          {isFastest && bids.length > 1 && (
                            <Badge variant="info" className="text-[10px]">{tBids('fastest')}</Badge>
                          )}
                        </div>
                      </td>

                      {/* Classification */}
                      <td className="px-2 py-3">
                        {contractor?.classification ? (
                          <Badge variant="outline">{tCommon('category')} {contractor.classification.toUpperCase()}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Tier */}
                      <td className="px-2 py-3">
                        {contractor?.subscription_tier && (
                          <Badge variant={contractor.subscription_tier as 'starter' | 'pro' | 'business' | 'enterprise'}>
                            <Shield className="me-1 h-3 w-3" />
                            {contractor.subscription_tier}
                          </Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-2 py-3">
                        <Badge variant={statusVariant as 'warning' | 'info' | 'success' | 'destructive'}>
                          {tCommon(bid.status)}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 ps-2 pe-4">
                        {(bid.status === 'pending' || bid.status === 'shortlisted') && (
                          <BidActions bidId={bid.id} status={bid.status} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-semibold text-foreground">{tBids('noBidsYet')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{tBids('noBidsDesc')}</p>
        </Card>
      )}

      {/* Bid methodology detail (expandable in future) */}
      {bids && bids.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{tBids('methodologyDetails')}</h2>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {bids.filter((b: any) => b.methodology_ar || b.methodology_en).map((bid: any) => {
            const contractor = contractors[bid.contractor_id];
            return (
              <Card key={bid.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {contractor?.company_name_ar || contractor?.full_name || tBids('contractor')}
                  </h3>
                  <Badge variant={BID_STATUS_VARIANT[bid.status] as 'warning' | 'info' | 'success' | 'destructive'}>
                    {tCommon(bid.status)}
                  </Badge>
                </div>
                {bid.methodology_ar && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{bid.methodology_ar}</p>
                )}
                {bid.methodology_en && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground" dir="ltr">{bid.methodology_en}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
