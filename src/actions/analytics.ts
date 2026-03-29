// =============================================================================
// Muhandes HUB — User Analytics Server Action
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { apiLimiter, checkRateLimit } from '@/lib/rate-limit';
import { GetAnalyticsSchema } from '@/schemas/analytics';
import { TIER_LIMITS } from '@/types';
import type { ActionResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsKpi {
  totalDeals: number;
  completedDeals: number;
  activeDeals: number;
  cancelledDeals: number;
  totalRevenue: number;
  avgRating: number;
  totalReviews: number;
}

export interface AnalyticsTrends {
  deals: number | null;
  revenue: number | null;
  rating: number | null;
}

export interface ContractorStats {
  projects: number;
  bids: number;
  awardedBids: number;
  bidWinRate: number;
  avgBidToAwardDays: number | null;
}

export interface SupplierStats {
  products: number;
  quotations: number;
  quotationAccepted: number;
  quotationConversionRate: number;
  inquiries: number;
}

export interface ProjectOwnerStats {
  projects: number;
  rfqs: number;
  totalBidsReceived: number;
  avgBidsPerProject: number;
}

export interface BuyerStats {
  rfqs: number;
  deals: number;
}

export type RoleStats =
  | { role: 'contractor'; stats: ContractorStats }
  | { role: 'supplier'; stats: SupplierStats }
  | { role: 'project_owner'; stats: ProjectOwnerStats }
  | { role: 'buyer'; stats: BuyerStats };

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface StatusBreakdown {
  label: string;
  value: number;
  color: string;
}

export interface AnalyticsCharts {
  dealsOverTime: ChartDataPoint[];
  revenueOverTime: ChartDataPoint[];
  dealsByStatus: StatusBreakdown[];
  ratingOverTime: ChartDataPoint[];
  // Contractor-specific
  bidsByStatus?: StatusBreakdown[];
  bidWinRateOverTime?: ChartDataPoint[];
  // Supplier-specific
  topProducts?: ChartDataPoint[];
  quotationsByStatus?: StatusBreakdown[];
}

export interface UserAnalyticsData {
  kpi: AnalyticsKpi;
  trends: AnalyticsTrends;
  roleStats: RoleStats;
  charts: AnalyticsCharts | null; // null for basic tier
  period: string;
}

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

function getPeriodDates(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const end = new Date();
  const start = new Date();
  const prevEnd = new Date();
  const prevStart = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      prevEnd.setDate(end.getDate() - 7);
      prevStart.setDate(end.getDate() - 14);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      prevEnd.setDate(end.getDate() - 30);
      prevStart.setDate(end.getDate() - 60);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      prevEnd.setDate(end.getDate() - 90);
      prevStart.setDate(end.getDate() - 180);
      break;
    case '12m':
      start.setFullYear(end.getFullYear() - 1);
      prevEnd.setFullYear(end.getFullYear() - 1);
      prevStart.setFullYear(end.getFullYear() - 2);
      break;
    default: // 'all'
      start.setFullYear(2020, 0, 1);
      prevEnd.setFullYear(2020, 0, 1);
      prevStart.setFullYear(2018, 0, 1);
      break;
  }

  return { start, end, prevStart, prevEnd };
}

function computeTrend(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function groupByTimeBucket(
  rows: { created_at: string; value?: number }[],
  period: string,
): ChartDataPoint[] {
  const bucketMap = new Map<string, number>();

  for (const row of rows) {
    const d = new Date(row.created_at);
    let key: string;
    if (period === '7d' || period === '30d') {
      key = d.toISOString().slice(0, 10); // daily
    } else if (period === '90d') {
      // weekly — ISO week start (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d);
      weekStart.setDate(diff);
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = d.toISOString().slice(0, 7); // monthly
    }
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + (row.value ?? 1));
  }

  const result: ChartDataPoint[] = [];
  for (const [label, value] of bucketMap.entries()) {
    result.push({ label, value });
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

const STATUS_COLORS: Record<string, string> = {
  active: '#2563eb',
  in_progress: '#d97706',
  completed: '#16a34a',
  cancelled: '#dc2626',
  disputed: '#7c3aed',
  pending: '#6b7280',
  shortlisted: '#0891b2',
  awarded: '#16a34a',
  rejected: '#dc2626',
  sent: '#2563eb',
  viewed: '#d97706',
  accepted: '#16a34a',
  expired: '#6b7280',
  draft: '#94a3b8',
};

// ---------------------------------------------------------------------------
// Main action
// ---------------------------------------------------------------------------

export async function getUserAnalytics(
  input: { period?: string } = {},
): Promise<ActionResult<UserAnalyticsData>> {
  // 1) Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // 2) Rate limit
  const limiter = apiLimiter();
  const rl = await checkRateLimit(limiter, user.id);
  if (!rl.success) return { data: null, error: 'Rate limit exceeded' };

  // 3) Zod validate
  const parsed = GetAnalyticsSchema.safeParse({ period: input.period ?? '30d' });
  if (!parsed.success) return { data: null, error: 'Invalid period' };
  const { period } = parsed.data;

  // 4) Get profile + tier
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('id, role, average_rating, total_reviews, total_deals')
    .eq('id', user.id)
    .single();

  if (!profile) return { data: null, error: 'Profile not found' };

  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = subscription?.tier ?? 'starter';
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.starter;
  const role = profile.role as string;
  const isAdvanced = limits.hasAnalytics === 'full' || role === 'project_owner';

  // 5) Period dates
  const { start, end, prevStart, prevEnd } = getPeriodDates(period);
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  const prevStartISO = prevStart.toISOString();
  const prevEndISO = prevEnd.toISOString();

  // 6) Fetch KPI data — parallel queries
  const userId = user.id;

  const [
    { data: currentDeals },
    { data: prevDeals },
    { count: totalDeals },
    { count: completedDeals },
    { count: activeDeals },
    { count: cancelledDeals },
    { data: reviews },
    { data: previousReviews },
  ] = await Promise.all([
    // Current period deals
    db(supabase).from('deals')
      .select('id, status, total_value, created_at')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .gte('created_at', startISO)
      .lte('created_at', endISO),
    // Previous period deals
    db(supabase).from('deals')
      .select('id, status, total_value, created_at')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .gte('created_at', prevStartISO)
      .lte('created_at', prevEndISO),
    // All-time counts
    db(supabase).from('deals')
      .select('id', { count: 'exact', head: true })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
    db(supabase).from('deals')
      .select('id', { count: 'exact', head: true })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'completed'),
    db(supabase).from('deals')
      .select('id', { count: 'exact', head: true })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .in('status', ['active', 'in_progress']),
    db(supabase).from('deals')
      .select('id', { count: 'exact', head: true })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'cancelled'),
    // Reviews (current period)
    db(supabase).from('reviews')
      .select('overall_rating, created_at')
      .eq('reviewee_id', userId)
      .gte('created_at', startISO)
      .lte('created_at', endISO),
    // Reviews (previous period)
    db(supabase).from('reviews')
      .select('overall_rating, created_at')
      .eq('reviewee_id', userId)
      .gte('created_at', prevStartISO)
      .lte('created_at', prevEndISO),
  ]);

  type DealRow = { id: string; status: string; total_value: number; created_at: string };
  type ReviewRow = { overall_rating: number; created_at: string };

  const curDeals = (currentDeals ?? []) as DealRow[];
  const prvDeals = (prevDeals ?? []) as DealRow[];
  const curReviews = (reviews ?? []) as ReviewRow[];
  const prvReviews = (previousReviews ?? []) as ReviewRow[];

  // Compute KPIs
  const curRevenue = curDeals.reduce((s, d) => s + Number(d.total_value ?? 0), 0);
  const prevRevenue = prvDeals.reduce((s, d) => s + Number(d.total_value ?? 0), 0);
  const totalRevenue = curRevenue; // for the current period

  const curAvgRating = curReviews.length > 0
    ? curReviews.reduce((s, r) => s + r.overall_rating, 0) / curReviews.length
    : 0;
  const prevAvgRating = prvReviews.length > 0
    ? prvReviews.reduce((s, r) => s + r.overall_rating, 0) / prvReviews.length
    : 0;

  const kpi: AnalyticsKpi = {
    totalDeals: totalDeals ?? 0,
    completedDeals: completedDeals ?? 0,
    activeDeals: activeDeals ?? 0,
    cancelledDeals: cancelledDeals ?? 0,
    totalRevenue,
    avgRating: Number(profile.average_rating ?? 0),
    totalReviews: Number(profile.total_reviews ?? 0),
  };

  const trends: AnalyticsTrends = {
    deals: computeTrend(curDeals.length, prvDeals.length),
    revenue: computeTrend(curRevenue, prevRevenue),
    rating: computeTrend(curAvgRating, prevAvgRating),
  };

  // 7) Role-specific stats
  const roleStats = await fetchRoleStats(supabase, userId, role);

  // 8) Charts (advanced tier only)
  let charts: AnalyticsCharts | null = null;
  if (isAdvanced) {
    charts = await buildCharts(supabase, userId, role, period, curDeals, curReviews);
  }

  return {
    data: {
      kpi,
      trends,
      roleStats,
      charts,
      period,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Role-specific stats
// ---------------------------------------------------------------------------

async function fetchRoleStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string,
): Promise<RoleStats> {
  if (role === 'contractor') {
    const [
      { count: projects },
      { count: bids },
      { count: awardedBids },
      { data: awardedBidsData },
    ] = await Promise.all([
      db(supabase).from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
      db(supabase).from('bids').select('*', { count: 'exact', head: true }).eq('contractor_id', userId),
      db(supabase).from('bids').select('*', { count: 'exact', head: true }).eq('contractor_id', userId).eq('status', 'awarded'),
      db(supabase).from('bids').select('created_at, awarded_at').eq('contractor_id', userId).eq('status', 'awarded'),
    ]);

    const totalBids = bids ?? 0;
    const wonBids = awardedBids ?? 0;
    const winRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;

    // Avg bid-to-award time
    type BidAwardRow = { created_at: string; awarded_at: string | null };
    const awardRows = (awardedBidsData ?? []) as BidAwardRow[];
    let avgDays: number | null = null;
    if (awardRows.length > 0) {
      const totalDays = awardRows.reduce((sum, r) => {
        if (!r.awarded_at) return sum;
        const diff = new Date(r.awarded_at).getTime() - new Date(r.created_at).getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      avgDays = Math.round(totalDays / awardRows.length);
    }

    return {
      role: 'contractor',
      stats: { projects: projects ?? 0, bids: totalBids, awardedBids: wonBids, bidWinRate: winRate, avgBidToAwardDays: avgDays },
    };
  }

  if (role === 'supplier') {
    const [
      { count: products },
      { count: quotations },
      { count: quotationAccepted },
      { count: inquiries },
    ] = await Promise.all([
      db(supabase).from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', userId),
      db(supabase).from('quotations').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
      db(supabase).from('quotations').select('*', { count: 'exact', head: true }).eq('sender_id', userId).eq('status', 'accepted'),
      db(supabase).from('inquiries').select('*', { count: 'exact', head: true }).eq('supplier_id', userId),
    ]);

    const totalQ = quotations ?? 0;
    const acceptedQ = quotationAccepted ?? 0;
    const conversionRate = totalQ > 0 ? Math.round((acceptedQ / totalQ) * 100) : 0;

    return {
      role: 'supplier',
      stats: { products: products ?? 0, quotations: totalQ, quotationAccepted: acceptedQ, quotationConversionRate: conversionRate, inquiries: inquiries ?? 0 },
    };
  }

  if (role === 'project_owner') {
    const [
      { count: projects },
      { count: rfqs },
      { count: totalBidsReceived },
    ] = await Promise.all([
      db(supabase).from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
      db(supabase).from('rfqs').select('*', { count: 'exact', head: true }).eq('poster_id', userId),
      db(supabase).from('bids').select('*', { count: 'exact', head: true })
        .in('project_id', db(supabase).from('projects').select('id').eq('owner_id', userId)),
    ]);

    const proj = projects ?? 0;
    const bidsRcvd = totalBidsReceived ?? 0;

    return {
      role: 'project_owner',
      stats: { projects: proj, rfqs: rfqs ?? 0, totalBidsReceived: bidsRcvd, avgBidsPerProject: proj > 0 ? Math.round(bidsRcvd / proj) : 0 },
    };
  }

  // buyer
  const [
    { count: rfqs },
    { count: deals },
  ] = await Promise.all([
    db(supabase).from('rfqs').select('*', { count: 'exact', head: true }).eq('poster_id', userId),
    db(supabase).from('deals').select('*', { count: 'exact', head: true }).eq('buyer_id', userId),
  ]);

  return {
    role: 'buyer',
    stats: { rfqs: rfqs ?? 0, deals: deals ?? 0 },
  };
}

// ---------------------------------------------------------------------------
// Build charts (advanced tier)
// ---------------------------------------------------------------------------

type DealRow = { id: string; status: string; total_value: number; created_at: string };
type ReviewRow = { overall_rating: number; created_at: string };

async function buildCharts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string,
  period: string,
  currentDeals: DealRow[],
  currentReviews: ReviewRow[],
): Promise<AnalyticsCharts> {
  // Deals over time
  const dealsOverTime = groupByTimeBucket(
    currentDeals.map((d) => ({ created_at: d.created_at })),
    period,
  );

  // Revenue over time
  const revenueOverTime = groupByTimeBucket(
    currentDeals.map((d) => ({ created_at: d.created_at, value: Number(d.total_value ?? 0) })),
    period,
  );

  // Deals by status
  const statusCounts: Record<string, number> = {};
  for (const d of currentDeals) {
    statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;
  }
  const dealsByStatus: StatusBreakdown[] = Object.entries(statusCounts).map(([label, value]) => ({
    label,
    value,
    color: STATUS_COLORS[label] ?? '#6b7280',
  }));

  // Rating over time
  const ratingBuckets = new Map<string, { sum: number; count: number }>();
  for (const r of currentReviews) {
    const d = new Date(r.created_at);
    const key = period === '7d' || period === '30d'
      ? d.toISOString().slice(0, 10)
      : d.toISOString().slice(0, 7);
    const bucket = ratingBuckets.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += r.overall_rating;
    bucket.count += 1;
    ratingBuckets.set(key, bucket);
  }
  const ratingOverTime: ChartDataPoint[] = [];
  for (const [label, { sum, count }] of ratingBuckets.entries()) {
    ratingOverTime.push({ label, value: Math.round((sum / count) * 10) / 10 });
  }
  ratingOverTime.sort((a, b) => a.label.localeCompare(b.label));

  const charts: AnalyticsCharts = {
    dealsOverTime,
    revenueOverTime,
    dealsByStatus,
    ratingOverTime,
  };

  // Role-specific chart data
  if (role === 'contractor') {
    const { data: bidsData } = await db(supabase)
      .from('bids')
      .select('status, created_at')
      .eq('contractor_id', userId);

    const bidRows = (bidsData ?? []) as { status: string; created_at: string }[];
    const bidStatusCounts: Record<string, number> = {};
    for (const b of bidRows) {
      bidStatusCounts[b.status] = (bidStatusCounts[b.status] ?? 0) + 1;
    }
    charts.bidsByStatus = Object.entries(bidStatusCounts).map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] ?? '#6b7280',
    }));

    // Bid win rate over time (monthly)
    const monthlyBids = new Map<string, { total: number; won: number }>();
    for (const b of bidRows) {
      const month = new Date(b.created_at).toISOString().slice(0, 7);
      const bucket = monthlyBids.get(month) ?? { total: 0, won: 0 };
      bucket.total += 1;
      if (b.status === 'awarded') bucket.won += 1;
      monthlyBids.set(month, bucket);
    }
    charts.bidWinRateOverTime = Array.from(monthlyBids.entries())
      .map(([label, { total, won }]) => ({ label, value: total > 0 ? Math.round((won / total) * 100) : 0 }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  if (role === 'supplier') {
    // Top products by deal count
    const { data: dealProducts } = await db(supabase)
      .from('deals')
      .select('title_ar, title_en')
      .eq('seller_id', userId)
      .eq('deal_type', 'deal_product')
      .order('created_at', { ascending: false })
      .limit(10);

    const productCounts: Record<string, number> = {};
    for (const d of (dealProducts ?? []) as { title_ar: string; title_en: string }[]) {
      const name = d.title_en || d.title_ar || 'Unknown';
      productCounts[name] = (productCounts[name] ?? 0) + 1;
    }
    charts.topProducts = Object.entries(productCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Quotations by status
    const { data: quotData } = await db(supabase)
      .from('quotations')
      .select('status')
      .eq('sender_id', userId);

    const quotStatusCounts: Record<string, number> = {};
    for (const q of (quotData ?? []) as { status: string }[]) {
      quotStatusCounts[q.status] = (quotStatusCounts[q.status] ?? 0) + 1;
    }
    charts.quotationsByStatus = Object.entries(quotStatusCounts).map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] ?? '#6b7280',
    }));
  }

  return charts;
}
