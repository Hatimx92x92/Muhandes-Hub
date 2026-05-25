// =============================================================================
// Muhandes HUB — User Analytics Server Action
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { apiLimiter, checkRateLimit } from '@/lib/rate-limit';
import { GetAnalyticsSchema } from '@/schemas/analytics';
import { getEffectiveLimits } from '@/types';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Public Platform Stats (no auth required)
// ---------------------------------------------------------------------------

export interface PublicStats {
  partners: number;
  projects: number;
  products: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  const supabase = await createClient();

  const [partnersRes, projectsRes, productsRes] = await Promise.all([
    db(supabase)
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('verification_status', 'active'),
    db(supabase)
      .from('projects')
      .select('id', { count: 'exact' })
      .eq('status', 'published'),
    db(supabase)
      .from('products')
      .select('id', { count: 'exact' })
      .eq('status', 'published'),
  ]);

  return {
    partners: partnersRes.count ?? 0,
    projects: projectsRes.count ?? 0,
    products: productsRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Network Graph Profiles (no auth required)
// ---------------------------------------------------------------------------

export interface NetworkProfile {
  id: string;
  full_name: string;
  company_name_ar: string | null;
  company_name_en: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  role: string;
  average_rating: number | null;
  total_deals: number | null;
}

export interface NetworkProfilesByRole {
  project_owner: NetworkProfile[];
  contractor: NetworkProfile[];
  supplier: NetworkProfile[];
  buyer: NetworkProfile[];
}

export async function getNetworkProfiles(): Promise<NetworkProfilesByRole> {
  const supabase = await createClient();
  const cols = 'id, full_name, company_name_ar, company_name_en, avatar_url, logo_url, role, average_rating, total_deals';

  const [poRes, contractorRes, supplierRes, buyerRes] = await Promise.all([
    db(supabase).from('profiles').select(cols)
      .eq('role', 'project_owner').eq('verification_status', 'active')
      .order('total_deals', { ascending: false, nullsFirst: false })
      .limit(5),
    db(supabase).from('profiles').select(cols)
      .eq('role', 'contractor').eq('verification_status', 'active')
      .order('total_deals', { ascending: false, nullsFirst: false })
      .limit(5),
    db(supabase).from('profiles').select(cols)
      .eq('role', 'supplier').eq('verification_status', 'active')
      .order('total_deals', { ascending: false, nullsFirst: false })
      .limit(5),
    db(supabase).from('profiles').select(cols)
      .eq('role', 'buyer').eq('verification_status', 'active')
      .order('total_deals', { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  return {
    project_owner: poRes.data ?? [],
    contractor: contractorRes.data ?? [],
    supplier: supplierRes.data ?? [],
    buyer: buyerRes.data ?? [],
  };
}

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
  avgDealValue: number;
  avgCompletionDays: number | null;
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
  // New: cross-role charts
  subRatings: ChartDataPoint[];
  topPartners: ChartDataPoint[];
  conversionFunnel: ChartDataPoint[];
  // Contractor-specific
  bidsByStatus?: StatusBreakdown[];
  bidWinRateOverTime?: ChartDataPoint[];
  // Supplier-specific
  topProducts?: ChartDataPoint[];
  quotationsByStatus?: StatusBreakdown[];
  // Project-owner-specific
  projectsByStatus?: StatusBreakdown[];
  bidsReceivedByStatus?: StatusBreakdown[];
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
  const role = profile.role as string;
  const limits = getEffectiveLimits(role, tier);
  const isAdvanced = limits.hasAnalytics === 'full';

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
      .select('id, status, value, created_at')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .gte('created_at', startISO)
      .lte('created_at', endISO),
    // Previous period deals
    db(supabase).from('deals')
      .select('id, status, value, created_at')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .gte('created_at', prevStartISO)
      .lte('created_at', prevEndISO),
    // All-time counts
    db(supabase).from('deals')
      .select('id', { count: 'exact' })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
    db(supabase).from('deals')
      .select('id', { count: 'exact' })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'completed'),
    db(supabase).from('deals')
      .select('id', { count: 'exact' })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .in('status', ['active', 'in_progress']),
    db(supabase).from('deals')
      .select('id', { count: 'exact' })
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

  type DealRow = { id: string; status: string; value: number; created_at: string };
  type ReviewRow = { overall_rating: number; created_at: string };

  const curDeals = (currentDeals ?? []) as DealRow[];
  const prvDeals = (prevDeals ?? []) as DealRow[];
  const curReviews = (reviews ?? []) as ReviewRow[];
  const prvReviews = (previousReviews ?? []) as ReviewRow[];

  // Compute KPIs
  const curRevenue = curDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const prevRevenue = prvDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const totalRevenue = curRevenue; // for the current period

  const curAvgRating = curReviews.length > 0
    ? curReviews.reduce((s, r) => s + r.overall_rating, 0) / curReviews.length
    : 0;
  const prevAvgRating = prvReviews.length > 0
    ? prvReviews.reduce((s, r) => s + r.overall_rating, 0) / prvReviews.length
    : 0;

  // Avg deal value
  const avgDealValue = curDeals.length > 0 ? Math.round(curRevenue / curDeals.length) : 0;

  // Avg completion days — from completed deals in current period
  const completedInPeriod = curDeals.filter((d) => d.status === 'completed');
  let avgCompletionDays: number | null = null;
  if (completedInPeriod.length > 0) {
    // Query completed deals with completed_at
    const { data: completedDealRows } = await db(supabase)
      .from('deals')
      .select('created_at, completed_at')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    type CompletionRow = { created_at: string; completed_at: string };
    const cRows = (completedDealRows ?? []) as CompletionRow[];
    if (cRows.length > 0) {
      const totalMs = cRows.reduce((sum, r) => {
        return sum + (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime());
      }, 0);
      avgCompletionDays = Math.round(totalMs / cRows.length / (1000 * 60 * 60 * 24));
    }
  }

  const kpi: AnalyticsKpi = {
    totalDeals: totalDeals ?? 0,
    completedDeals: completedDeals ?? 0,
    activeDeals: activeDeals ?? 0,
    cancelledDeals: cancelledDeals ?? 0,
    totalRevenue,
    avgRating: Number(profile.average_rating ?? 0),
    totalReviews: Number(profile.total_reviews ?? 0),
    avgDealValue,
    avgCompletionDays,
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
      db(supabase).from('projects').select('id', { count: 'exact' }).eq('owner_id', userId),
      db(supabase).from('bids').select('id', { count: 'exact' }).eq('contractor_id', userId),
      db(supabase).from('bids').select('id', { count: 'exact' }).eq('contractor_id', userId).eq('status', 'awarded'),
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
      db(supabase).from('products').select('id', { count: 'exact' }).eq('supplier_id', userId),
      db(supabase).from('quotations').select('id', { count: 'exact' }).eq('sender_id', userId),
      db(supabase).from('quotations').select('id', { count: 'exact' }).eq('sender_id', userId).eq('status', 'accepted'),
      db(supabase).from('inquiries').select('id', { count: 'exact' }).eq('supplier_id', userId),
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
    // First fetch project IDs, then use them for the bids count
    const [
      { count: projects, data: projectRows },
      { count: rfqs },
    ] = await Promise.all([
      db(supabase).from('projects').select('id', { count: 'exact' }).eq('owner_id', userId),
      db(supabase).from('rfqs').select('id', { count: 'exact' }).eq('poster_id', userId),
    ]);

    const projectIds = (projectRows ?? []).map((p: { id: string }) => p.id);
    let bidsRcvd = 0;
    if (projectIds.length > 0) {
      const { count: totalBidsReceived } = await db(supabase)
        .from('bids').select('id', { count: 'exact' })
        .in('project_id', projectIds);
      bidsRcvd = totalBidsReceived ?? 0;
    }

    const proj = projects ?? 0;

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
    db(supabase).from('rfqs').select('id', { count: 'exact' }).eq('poster_id', userId),
    db(supabase).from('deals').select('id', { count: 'exact' }).eq('buyer_id', userId),
  ]);

  return {
    role: 'buyer',
    stats: { rfqs: rfqs ?? 0, deals: deals ?? 0 },
  };
}

// ---------------------------------------------------------------------------
// Build charts (advanced tier)
// ---------------------------------------------------------------------------

type DealRow = { id: string; status: string; value: number; created_at: string };
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
    currentDeals.map((d) => ({ created_at: d.created_at, value: Number(d.value ?? 0) })),
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
    subRatings: [],
    topPartners: [],
    conversionFunnel: [],
  };

  // ── Cross-role: Sub-ratings radar ────────────────────────────────────
  const { data: subRatingRows } = await db(supabase)
    .from('reviews')
    .select('quality_rating, timeliness_rating, communication_rating')
    .eq('reviewee_id', userId);

  type SubRatingRow = { quality_rating: number | null; timeliness_rating: number | null; communication_rating: number | null };
  const srRows = (subRatingRows ?? []) as SubRatingRow[];
  if (srRows.length > 0) {
    const sum = { quality: 0, timeliness: 0, communication: 0 };
    const cnt = { quality: 0, timeliness: 0, communication: 0 };
    for (const r of srRows) {
      if (r.quality_rating != null) { sum.quality += r.quality_rating; cnt.quality++; }
      if (r.timeliness_rating != null) { sum.timeliness += r.timeliness_rating; cnt.timeliness++; }
      if (r.communication_rating != null) { sum.communication += r.communication_rating; cnt.communication++; }
    }
    charts.subRatings = [
      { label: 'quality', value: cnt.quality > 0 ? Math.round((sum.quality / cnt.quality) * 10) / 10 : 0 },
      { label: 'timeliness', value: cnt.timeliness > 0 ? Math.round((sum.timeliness / cnt.timeliness) * 10) / 10 : 0 },
      { label: 'communication', value: cnt.communication > 0 ? Math.round((sum.communication / cnt.communication) * 10) / 10 : 0 },
    ];
  }

  // ── Cross-role: Top partners by deal value ───────────────────────────
  const { data: allDealsForPartners } = await db(supabase)
    .from('deals')
    .select('buyer_id, seller_id, value')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .in('status', ['completed', 'in_progress', 'active']);

  type PartnerDealRow = { buyer_id: string; seller_id: string; value: number };
  const partnerDeals = (allDealsForPartners ?? []) as PartnerDealRow[];
  if (partnerDeals.length > 0) {
    const partnerSums = new Map<string, number>();
    for (const d of partnerDeals) {
      const partnerId = d.buyer_id === userId ? d.seller_id : d.buyer_id;
      partnerSums.set(partnerId, (partnerSums.get(partnerId) ?? 0) + Number(d.value ?? 0));
    }
    // Get top 5 partner IDs
    const topPartnerEntries = Array.from(partnerSums.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topPartnerIds = topPartnerEntries.map(([id]) => id);

    if (topPartnerIds.length > 0) {
      const { data: partnerProfiles } = await db(supabase)
        .from('profiles')
        .select('id, company_name_en, company_name_ar')
        .in('id', topPartnerIds);

      type ProfileRow = { id: string; company_name_en: string | null; company_name_ar: string | null };
      const profileMap = new Map<string, string>();
      for (const p of (partnerProfiles ?? []) as ProfileRow[]) {
        profileMap.set(p.id, p.company_name_en || p.company_name_ar || 'Partner');
      }

      charts.topPartners = topPartnerEntries.map(([id, value]) => ({
        label: profileMap.get(id) ?? 'Partner',
        value,
      }));
    }
  }

  // ── Cross-role: Conversion funnel ────────────────────────────────────
  if (role === 'contractor') {
    const [
      { count: totalBids },
      { count: shortlistedBids },
      { count: awardedBids },
      { count: funnelDeals },
      { count: funnelCompleted },
    ] = await Promise.all([
      db(supabase).from('bids').select('id', { count: 'exact' }).eq('contractor_id', userId),
      db(supabase).from('bids').select('id', { count: 'exact' }).eq('contractor_id', userId).eq('status', 'shortlisted'),
      db(supabase).from('bids').select('id', { count: 'exact' }).eq('contractor_id', userId).eq('status', 'awarded'),
      db(supabase).from('deals').select('id', { count: 'exact' }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      db(supabase).from('deals').select('id', { count: 'exact' }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).eq('status', 'completed'),
    ]);
    charts.conversionFunnel = [
      { label: 'bids', value: totalBids ?? 0 },
      { label: 'shortlisted', value: shortlistedBids ?? 0 },
      { label: 'awarded', value: awardedBids ?? 0 },
      { label: 'deals', value: funnelDeals ?? 0 },
      { label: 'completed', value: funnelCompleted ?? 0 },
    ];
  } else if (role === 'supplier') {
    const [
      { count: totalQuotations },
      { count: viewedQuotations },
      { count: acceptedQuotations },
      { count: funnelDeals },
      { count: funnelCompleted },
    ] = await Promise.all([
      db(supabase).from('quotations').select('id', { count: 'exact' }).eq('sender_id', userId),
      db(supabase).from('quotations').select('id', { count: 'exact' }).eq('sender_id', userId).eq('status', 'viewed'),
      db(supabase).from('quotations').select('id', { count: 'exact' }).eq('sender_id', userId).eq('status', 'accepted'),
      db(supabase).from('deals').select('id', { count: 'exact' }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      db(supabase).from('deals').select('id', { count: 'exact' }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).eq('status', 'completed'),
    ]);
    charts.conversionFunnel = [
      { label: 'quotations', value: totalQuotations ?? 0 },
      { label: 'viewed', value: viewedQuotations ?? 0 },
      { label: 'accepted', value: acceptedQuotations ?? 0 },
      { label: 'deals', value: funnelDeals ?? 0 },
      { label: 'completed', value: funnelCompleted ?? 0 },
    ];
  } else if (role === 'project_owner') {
    const [
      { count: totalProjects },
      { count: totalRfqs },
      { count: funnelBidsReceived },
      { count: funnelDeals },
      { count: funnelCompleted },
    ] = await Promise.all([
      db(supabase).from('projects').select('id', { count: 'exact' }).eq('owner_id', userId),
      db(supabase).from('rfqs').select('id', { count: 'exact' }).eq('poster_id', userId),
      db(supabase).from('bids').select('id', { count: 'exact' }).in('project_id',
        (await db(supabase).from('projects').select('id').eq('owner_id', userId)).data?.map((p: { id: string }) => p.id) ?? []
      ),
      db(supabase).from('deals').select('id', { count: 'exact' }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      db(supabase).from('deals').select('id', { count: 'exact' }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).eq('status', 'completed'),
    ]);
    charts.conversionFunnel = [
      { label: 'projects', value: totalProjects ?? 0 },
      { label: 'rfqs', value: totalRfqs ?? 0 },
      { label: 'bidsReceived', value: funnelBidsReceived ?? 0 },
      { label: 'deals', value: funnelDeals ?? 0 },
      { label: 'completed', value: funnelCompleted ?? 0 },
    ];
  } else {
    // buyer
    const [
      { count: totalRfqs },
      { count: funnelDeals },
      { count: funnelCompleted },
    ] = await Promise.all([
      db(supabase).from('rfqs').select('id', { count: 'exact' }).eq('poster_id', userId),
      db(supabase).from('deals').select('id', { count: 'exact' }).eq('buyer_id', userId),
      db(supabase).from('deals').select('id', { count: 'exact' }).eq('buyer_id', userId).eq('status', 'completed'),
    ]);
    charts.conversionFunnel = [
      { label: 'rfqs', value: totalRfqs ?? 0 },
      { label: 'deals', value: funnelDeals ?? 0 },
      { label: 'completed', value: funnelCompleted ?? 0 },
    ];
  }

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

  // ── Project Owner: Projects by status + Bids received by status ──────
  if (role === 'project_owner') {
    const { data: ownerProjects } = await db(supabase)
      .from('projects')
      .select('id, status')
      .eq('owner_id', userId);

    type ProjRow = { id: string; status: string };
    const projRows = (ownerProjects ?? []) as ProjRow[];
    const projStatusCounts: Record<string, number> = {};
    for (const p of projRows) {
      projStatusCounts[p.status] = (projStatusCounts[p.status] ?? 0) + 1;
    }
    charts.projectsByStatus = Object.entries(projStatusCounts).map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] ?? '#6b7280',
    }));

    // Bids received across all projects
    const projIds = projRows.map((p) => p.id);
    if (projIds.length > 0) {
      const { data: recvBids } = await db(supabase)
        .from('bids')
        .select('status')
        .in('project_id', projIds);

      const bidRcvdCounts: Record<string, number> = {};
      for (const b of (recvBids ?? []) as { status: string }[]) {
        bidRcvdCounts[b.status] = (bidRcvdCounts[b.status] ?? 0) + 1;
      }
      charts.bidsReceivedByStatus = Object.entries(bidRcvdCounts).map(([label, value]) => ({
        label,
        value,
        color: STATUS_COLORS[label] ?? '#6b7280',
      }));
    }
  }

  return charts;
}

// ---------------------------------------------------------------------------
// DASHBOARD ACTIVITY FEED — Recent events across user's deals + notifications
// ---------------------------------------------------------------------------

export interface DashboardActivityItem {
  id: string;
  type: 'deal_activity' | 'notification';
  action: string;
  title: string;
  subtitle?: string;
  href?: string;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
}

export async function getDashboardActivity(): Promise<ActionResult<DashboardActivityItem[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Must be logged in' };

  const userId = user.id;

  // Parallel queries: deal activity + recent notifications
  const [activityResult, notificationsResult] = await Promise.all([
    // Deal activity log — recent events for user's deals
    db(supabase)
      .from('deal_activity_log')
      .select(`
        id,
        deal_id,
        action,
        details,
        created_at,
        actor:profiles!deal_activity_log_actor_id_fkey(full_name, avatar_url)
      `)
      .or(`deal_id.in.(${
        // Sub-select: user's deal IDs
        `select id from deals where buyer_id = '${userId}' or seller_id = '${userId}'`
      })`)
      .order('created_at', { ascending: false })
      .limit(10),

    // Recent notifications
    db(supabase)
      .from('notifications')
      .select('id, type, title_ar, title_en, body_ar, body_en, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const items: DashboardActivityItem[] = [];

  // Map deal activities
  for (const a of activityResult.data ?? []) {
    const actor = a.actor as Record<string, string> | null;
    items.push({
      id: `activity-${a.id}`,
      type: 'deal_activity',
      action: a.action,
      title: a.action?.replace(/_/g, ' ') ?? 'Activity',
      subtitle: (a.details as Record<string, unknown>)?.note as string | undefined,
      href: `/dashboard/deals/${a.deal_id}`,
      created_at: a.created_at,
      actor_name: actor?.full_name,
      actor_avatar: actor?.avatar_url,
    });
  }

  // Map notifications
  for (const n of notificationsResult.data ?? []) {
    items.push({
      id: `notif-${n.id}`,
      type: 'notification',
      action: n.type,
      title: n.title_en || n.title_ar || 'Notification',
      subtitle: n.body_en || n.body_ar || undefined,
      href: n.link || undefined,
      created_at: n.created_at,
    });
  }

  // Sort by time descending, take top 10
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { data: items.slice(0, 10), error: null };
}
