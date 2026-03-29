// =============================================================================
// Muhandes HUB — Admin Paginated Query Actions
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

async function verifyAdmin() {
  const t = await getTranslations('actions.adminUsers');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error(t('mustLogin'));

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error(t('adminOnly'));
  // Return admin client to bypass RLS for admin queries
  return createAdminClient();
}

// ------- Shared Types -------

export interface AdminQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  filters?: Record<string, string>;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 25;

function parseSortParam(sort: string | undefined): { column: string; ascending: boolean } | null {
  if (!sort) return null;
  const [col, dir] = sort.split(':');
  if (!col) return null;
  return { column: col, ascending: dir === 'asc' };
}

// ------- Users -------

export interface AdminUserRow {
  id: string;
  full_name: string | null;
  company_name_ar: string | null;
  company_name_en: string | null;
  role: string;
  verification_status: string;
  is_admin: boolean;
  created_at: string;
}

export async function getAdminUsers(params: AdminQueryParams): Promise<PaginatedResult<AdminUserRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('profiles')
    .select('id, full_name, company_name_ar, company_name_en, role, verification_status, is_admin, created_at', { count: 'exact' });

  // Filters
  if (params.filters?.status) {
    query = query.eq('verification_status', params.filters.status);
  }
  if (params.filters?.role) {
    query = query.eq('role', params.filters.role);
  }

  // Search
  if (params.search) {
    const s = params.search.replace(/[%_]/g, '');
    query = query.or(`full_name.ilike.%${s}%,company_name_ar.ilike.%${s}%,company_name_en.ilike.%${s}%`);
  }

  // Sort
  const sort = parseSortParam(params.sort);
  if (sort && ['full_name', 'created_at', 'verification_status', 'role'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;
  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as AdminUserRow[],
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ------- Posts (merged from projects, products, rfqs) -------

export interface AdminPostRow {
  id: string;
  title_ar: string;
  title_en: string;
  status: string;
  created_at: string;
  type: 'project' | 'product' | 'rfq';
}

export async function getAdminPosts(params: AdminQueryParams): Promise<PaginatedResult<AdminPostRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const statusFilter = params.filters?.status;
  const typeFilter = params.filters?.type;

  // Build individual table queries
  const shouldFetch = (type: string) => !typeFilter || typeFilter === type;

  const projectPromise = shouldFetch('project')
    ? (async () => {
        let q = db(supabase).from('projects').select('id, title_ar, title_en, status, created_at', { count: 'exact' });
        if (statusFilter) q = q.eq('status', statusFilter);
        if (params.search) {
          const s = params.search.replace(/[%_]/g, '');
          q = q.or(`title_ar.ilike.%${s}%,title_en.ilike.%${s}%`);
        }
        const { data, count } = await q.order('created_at', { ascending: false }).limit(500);
        return { data: (data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string, title_ar: p.title_ar as string ?? '', title_en: p.title_en as string ?? '',
          status: p.status as string, created_at: p.created_at as string, type: 'project' as const,
        })), count: count ?? 0 };
      })()
    : Promise.resolve({ data: [] as AdminPostRow[], count: 0 });

  const productPromise = shouldFetch('product')
    ? (async () => {
        let q = db(supabase).from('products').select('id, name_ar, name_en, status, created_at', { count: 'exact' });
        if (statusFilter) q = q.eq('status', statusFilter);
        if (params.search) {
          const s = params.search.replace(/[%_]/g, '');
          q = q.or(`name_ar.ilike.%${s}%,name_en.ilike.%${s}%`);
        }
        const { data, count } = await q.order('created_at', { ascending: false }).limit(500);
        return { data: (data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string, title_ar: p.name_ar as string ?? '', title_en: p.name_en as string ?? '',
          status: p.status as string, created_at: p.created_at as string, type: 'product' as const,
        })), count: count ?? 0 };
      })()
    : Promise.resolve({ data: [] as AdminPostRow[], count: 0 });

  const rfqPromise = shouldFetch('rfq')
    ? (async () => {
        let q = db(supabase).from('rfqs').select('id, title_ar, title_en, status, created_at', { count: 'exact' });
        if (statusFilter) q = q.eq('status', statusFilter);
        if (params.search) {
          const s = params.search.replace(/[%_]/g, '');
          q = q.or(`title_ar.ilike.%${s}%,title_en.ilike.%${s}%`);
        }
        const { data, count } = await q.order('created_at', { ascending: false }).limit(500);
        return { data: (data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string, title_ar: p.title_ar as string ?? '', title_en: p.title_en as string ?? '',
          status: p.status as string, created_at: p.created_at as string, type: 'rfq' as const,
        })), count: count ?? 0 };
      })()
    : Promise.resolve({ data: [] as AdminPostRow[], count: 0 });

  const [projects, products, rfqs] = await Promise.all([projectPromise, productPromise, rfqPromise]);

  // Merge and sort
  const allPosts = [...projects.data, ...products.data, ...rfqs.data]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalCount = allPosts.length;
  const offset = (page - 1) * pageSize;
  const paged = allPosts.slice(offset, offset + pageSize);

  return {
    data: paged,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ------- Deals -------

export interface AdminDealRow {
  id: string;
  deal_type: string;
  status: string;
  value: number;
  created_at: string;
  buyer_id: string;
  seller_id: string;
}

export async function getAdminDeals(params: AdminQueryParams): Promise<PaginatedResult<AdminDealRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('deals')
    .select('id, deal_type, status, value, created_at, buyer_id, seller_id', { count: 'exact' });

  if (params.filters?.status) query = query.eq('status', params.filters.status);
  if (params.filters?.type) query = query.eq('deal_type', params.filters.type);

  const sort = parseSortParam(params.sort);
  if (sort && ['created_at', 'value', 'status'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  return {
    data: (data ?? []) as AdminDealRow[],
    totalCount: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ------- Commissions -------

export interface AdminCommissionRow {
  id: string;
  deal_id: string;
  seller_id: string;
  amount: number;
  vat_amount: number;
  total: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  dispute_reason: string | null;
  created_at: string;
}

export async function getAdminCommissions(params: AdminQueryParams): Promise<PaginatedResult<AdminCommissionRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('commissions')
    .select('id, deal_id, seller_id, amount, vat_amount, total, status, due_date, paid_at, dispute_reason, created_at', { count: 'exact' });

  if (params.filters?.status) query = query.eq('status', params.filters.status);

  const sort = parseSortParam(params.sort);
  if (sort && ['created_at', 'due_date', 'amount', 'total', 'status'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  return {
    data: (data ?? []) as AdminCommissionRow[],
    totalCount: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ------- Commission Stats -------

export interface CommissionStats {
  pending: number;
  disputed: number;
  overdue: number;
}

export async function getAdminCommissionStats(): Promise<CommissionStats> {
  const supabase = await verifyAdmin();
  const [{ count: pending }, { count: disputed }, { count: overdue }] = await Promise.all([
    db(supabase).from('commissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db(supabase).from('commissions').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    db(supabase).from('commissions').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
  ]);
  return { pending: pending ?? 0, disputed: disputed ?? 0, overdue: overdue ?? 0 };
}

// ------- Subscriptions -------

export interface AdminSubscriptionRow {
  id: string;
  user_id: string;
  tier: string;
  is_active: boolean;
  payment_status: string | null;
  starts_at: string | null;
  expires_at: string | null;
  final_price: number;
  created_at: string;
  user_name: string | null;
  bank_receipt_url: string | null;
  payment_method: string | null;
}

export async function getAdminSubscriptions(params: AdminQueryParams): Promise<PaginatedResult<AdminSubscriptionRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('subscriptions')
    .select('id, user_id, tier, is_active, payment_status, payment_method, starts_at, expires_at, final_price, created_at, profiles:user_id(full_name, bank_receipt_url)', { count: 'exact' });

  if (params.filters?.tier) query = query.eq('tier', params.filters.tier);
  if (params.filters?.status === 'active') query = query.eq('is_active', true);
  if (params.filters?.status === 'expired') query = query.eq('is_active', false);
  if (params.filters?.status === 'pending_payment') query = query.eq('payment_status', 'pending_payment');

  const sort = parseSortParam(params.sort);
  if (sort && ['created_at', 'expires_at', 'tier', 'final_price'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  const rows = (data ?? []).map((sub: Record<string, unknown>) => {
    const profiles = sub.profiles as Record<string, string> | null;
    return {
      id: sub.id as string,
      user_id: sub.user_id as string,
      tier: sub.tier as string,
      is_active: sub.is_active as boolean,
      payment_status: sub.payment_status as string | null,
      starts_at: sub.starts_at as string | null,
      expires_at: sub.expires_at as string | null,
      final_price: Number(sub.final_price ?? 0),
      created_at: sub.created_at as string,
      user_name: profiles?.full_name ?? null,
      bank_receipt_url: profiles?.bank_receipt_url ?? null,
      payment_method: sub.payment_method as string | null,
    };
  });

  return {
    data: rows,
    totalCount: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ------- Subscription Stats -------

export interface SubscriptionStats {
  starter: number;
  pro: number;
  business: number;
  enterprise: number;
}

export async function getAdminSubscriptionStats(): Promise<SubscriptionStats> {
  const supabase = await verifyAdmin();
  const [
    { count: starter },
    { count: pro },
    { count: business },
    { count: enterprise },
  ] = await Promise.all([
    db(supabase).from('subscriptions').select('id', { count: 'exact', head: true }).eq('tier', 'starter').eq('is_active', true),
    db(supabase).from('subscriptions').select('id', { count: 'exact', head: true }).eq('tier', 'pro').eq('is_active', true),
    db(supabase).from('subscriptions').select('id', { count: 'exact', head: true }).eq('tier', 'business').eq('is_active', true),
    db(supabase).from('subscriptions').select('id', { count: 'exact', head: true }).eq('tier', 'enterprise').eq('is_active', true),
  ]);
  return {
    starter: starter ?? 0,
    pro: pro ?? 0,
    business: business ?? 0,
    enterprise: enterprise ?? 0,
  };
}

// ------- Reviews -------

export interface AdminReviewRow {
  id: string;
  deal_id: string;
  reviewer_id: string;
  reviewee_id: string;
  overall_rating: number;
  comment_ar: string | null;
  comment_en: string | null;
  is_hidden: boolean;
  created_at: string;
}

export async function getAdminReviews(params: AdminQueryParams): Promise<PaginatedResult<AdminReviewRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('reviews')
    .select('id, deal_id, reviewer_id, reviewee_id, overall_rating, comment_ar, comment_en, is_hidden, created_at', { count: 'exact' });

  if (params.filters?.visibility === 'visible') query = query.eq('is_hidden', false);
  if (params.filters?.visibility === 'hidden') query = query.eq('is_hidden', true);

  const sort = parseSortParam(params.sort);
  if (sort && ['created_at', 'overall_rating'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  return {
    data: (data ?? []) as AdminReviewRow[],
    totalCount: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ------- Review Stats -------

export interface ReviewStats {
  total: number;
  hidden: number;
}

export async function getAdminReviewStats(): Promise<ReviewStats> {
  const supabase = await verifyAdmin();
  const [{ count: total }, { count: hidden }] = await Promise.all([
    db(supabase).from('reviews').select('id', { count: 'exact', head: true }),
    db(supabase).from('reviews').select('id', { count: 'exact', head: true }).eq('is_hidden', true),
  ]);
  return { total: total ?? 0, hidden: hidden ?? 0 };
}

// ------- Audit Log -------

export interface AdminAuditLogRow {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export async function getAdminAuditLog(params: AdminQueryParams): Promise<PaginatedResult<AdminAuditLogRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('admin_audit_log')
    .select('id, admin_id, action, target_type, target_id, details, ip_address, created_at', { count: 'exact' });

  if (params.filters?.action) query = query.eq('action', params.filters.action);
  if (params.filters?.target_type) query = query.eq('target_type', params.filters.target_type);

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  return {
    data: (data ?? []) as AdminAuditLogRow[],
    totalCount: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
