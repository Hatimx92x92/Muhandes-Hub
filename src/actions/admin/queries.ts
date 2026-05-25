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

/** Convert a bank_receipt_url (which may be a bare storage path) into a full public URL */
function resolveReceiptUrl(raw: string | null): string | null {
  if (!raw) return null;
  // Already a full URL (from uploadFile helper)
  if (raw.startsWith('http')) return raw;
  // Bare path — build full Supabase storage public URL
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return raw;
  return `${base}/storage/v1/object/public/bank-payments/${raw}`;
}

export async function verifyAdmin() {
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

// ------- Registrations (pending verification users) -------

export interface AdminRegistrationRow {
  id: string;
  full_name: string | null;
  company_name_ar: string | null;
  company_name_en: string | null;
  role: string;
  verification_status: string;
  subscription_tier: string;
  email: string | null;
  phone: string | null;
  cr_number: string | null;
  vat_number: string | null;
  profile_type: string;
  provider: string;
  bank_receipt_url: string | null;
  created_at: string;
  // Subscription fields
  subscription_id: string | null;
  payment_method: string | null;
  payment_status: string | null;
  final_price: number | null;
  documents: {
    id: string;
    document_type: string;
    file_url: string;
    status: string;
    created_at: string;
  }[];
}

export async function getAdminRegistrations(params: AdminQueryParams): Promise<PaginatedResult<AdminRegistrationRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const selectCols = 'id, full_name, company_name_ar, company_name_en, role, verification_status, phone, cr_number, vat_number, profile_type, provider, bank_receipt_url, created_at';
  const pendingStatuses = ['pending_email', 'pending_payment', 'pending_documents', 'pending_approval'];

  let query = db(supabase)
    .from('profiles')
    .select(selectCols, { count: 'exact' });

  // Filter by specific pending status or all pending
  if (params.filters?.status && pendingStatuses.includes(params.filters.status)) {
    query = query.eq('verification_status', params.filters.status);
  } else {
    query = query.in('verification_status', pendingStatuses);
  }

  if (params.filters?.role) {
    query = query.eq('role', params.filters.role);
  }

  if (params.search) {
    const s = params.search.replace(/[%_]/g, '');
    query = query.or(`full_name.ilike.%${s}%,company_name_ar.ilike.%${s}%,company_name_en.ilike.%${s}%`);
  }

  const sort = parseSortParam(params.sort);
  if (sort && ['full_name', 'created_at', 'verification_status'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data: profiles, count } = await query;

  if (!profiles || profiles.length === 0) {
    return { data: [], totalCount: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / pageSize) };
  }

  // Fetch verification documents + subscriptions + auth emails for these users in parallel
  const userIds = profiles.map((p: { id: string }) => p.id);

  const adminClient = createAdminClient();

  const [{ data: allDocs }, { data: allSubs }, ...authResults] = await Promise.all([
    db(supabase)
      .from('verification_documents')
      .select('id, user_id, doc_type, file_url, status, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
    db(supabase)
      .from('subscriptions')
      .select('id, user_id, tier, payment_method, payment_status, final_price')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
    ...userIds.map((uid: string) => adminClient.auth.admin.getUserById(uid)),
  ]);

  // Build email lookup from auth results
  const emailByUser = new Map<string, string>();
  for (let i = 0; i < userIds.length; i++) {
    const authRes = authResults[i] as { data?: { user?: { email?: string } } };
    if (authRes?.data?.user?.email) {
      emailByUser.set(userIds[i] as string, authRes.data.user.email);
    }
  }

  const docsByUser = new Map<string, typeof allDocs>();
  for (const doc of allDocs ?? []) {
    const existing = docsByUser.get(doc.user_id) ?? [];
    existing.push(doc);
    docsByUser.set(doc.user_id, existing);
  }

  // Keep only the latest subscription per user
  interface SubRow { id: string; user_id: string; tier: string; payment_method: string | null; payment_status: string | null; final_price: number | null }
  const subByUser = new Map<string, SubRow>();
  for (const sub of (allSubs ?? []) as SubRow[]) {
    if (!subByUser.has(sub.user_id)) {
      subByUser.set(sub.user_id, sub);
    }
  }

  // If payment_method filter is set, filter profiles client-side (subscription is separate table)
  let filteredProfiles = profiles as Record<string, unknown>[];
  if (params.filters?.payment_method) {
    const method = params.filters.payment_method;
    filteredProfiles = filteredProfiles.filter((p) => {
      const sub = subByUser.get(p.id as string);
      return sub?.payment_method === method;
    });
  }

  const data: AdminRegistrationRow[] = filteredProfiles.map((p) => {
    const sub = subByUser.get(p.id as string);
    return {
      id: p.id as string,
      full_name: p.full_name as string | null,
      company_name_ar: p.company_name_ar as string | null,
      company_name_en: p.company_name_en as string | null,
      role: p.role as string,
      verification_status: p.verification_status as string,
      subscription_tier: (sub?.tier as string) ?? 'starter',
      email: emailByUser.get(p.id as string) ?? null,
      phone: p.phone as string | null,
      cr_number: p.cr_number as string | null,
      vat_number: p.vat_number as string | null,
      profile_type: p.profile_type as string,
      provider: p.provider as string,
      bank_receipt_url: resolveReceiptUrl(p.bank_receipt_url as string | null),
      created_at: p.created_at as string,
      subscription_id: (sub?.id as string) ?? null,
      payment_method: (sub?.payment_method as string) ?? null,
      payment_status: (sub?.payment_status as string) ?? null,
      final_price: sub ? Number(sub.final_price ?? 0) : null,
      documents: (docsByUser.get(p.id as string) ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        document_type: d.doc_type as string,
        file_url: d.file_url as string,
        status: d.status as string,
        created_at: d.created_at as string,
      })),
    };
  });

  const totalCount = count ?? 0;

  return {
    data,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ------- Registration Stats -------

export async function getRegistrationStats(): Promise<{
  pendingEmail: number;
  pendingPayment: number;
  pendingDocuments: number;
  pendingApproval: number;
  total: number;
}> {
  const supabase = await verifyAdmin();

  const [{ count: pe }, { count: pp }, { count: pd }, { count: pa }] = await Promise.all([
    db(supabase).from('profiles').select('id', { count: 'exact' }).eq('verification_status', 'pending_email'),
    db(supabase).from('profiles').select('id', { count: 'exact' }).eq('verification_status', 'pending_payment'),
    db(supabase).from('profiles').select('id', { count: 'exact' }).eq('verification_status', 'pending_documents'),
    db(supabase).from('profiles').select('id', { count: 'exact' }).eq('verification_status', 'pending_approval'),
  ]);

  const pendingEmail = pe ?? 0;
  const pendingPayment = pp ?? 0;
  const pendingDocuments = pd ?? 0;
  const pendingApproval = pa ?? 0;

  return {
    pendingEmail,
    pendingPayment,
    pendingDocuments,
    pendingApproval,
    total: pendingEmail + pendingPayment + pendingDocuments + pendingApproval,
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

// ------- Bids -------

export interface AdminBidRow {
  id: string;
  amount: number;
  timeline_days: number;
  status: string;
  created_at: string;
  contractor_name: string;
  contractor_company: string;
  project_title_ar: string;
  project_title_en: string;
}

export async function getAdminBids(params: AdminQueryParams): Promise<PaginatedResult<AdminBidRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('bids')
    .select(`
      id, amount, timeline_days, status, created_at,
      profiles!bids_contractor_id_fkey(full_name, company_name_ar, company_name_en),
      projects!bids_project_id_fkey(title_ar, title_en)
    `, { count: 'exact' });

  if (params.filters?.status) query = query.eq('status', params.filters.status);
  if (params.filters?.project_id) query = query.eq('project_id', params.filters.project_id);

  const sort = parseSortParam(params.sort);
  if (sort && ['created_at', 'amount', 'timeline_days', 'status'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  const rows = (data ?? []).map((b: Record<string, unknown>) => {
    const profile = b.profiles as Record<string, string> | null;
    const project = b.projects as Record<string, string> | null;
    return {
      id: b.id as string,
      amount: Number(b.amount),
      timeline_days: Number(b.timeline_days),
      status: b.status as string,
      created_at: b.created_at as string,
      contractor_name: profile?.full_name ?? '—',
      contractor_company: profile?.company_name_ar ?? '',
      project_title_ar: project?.title_ar ?? '',
      project_title_en: project?.title_en ?? '',
    } satisfies AdminBidRow;
  });

  return {
    data: rows,
    totalCount: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
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
  // Joined fields
  seller_name: string | null;
  seller_company: string | null;
  seller_email: string | null;
  deal_type: string | null;
  deal_value: number | null;
  deal_status: string | null;
  payment_method: string | null;
  bank_receipt_url: string | null;
  commission_rate: number | null;
}

export async function getAdminCommissions(params: AdminQueryParams): Promise<PaginatedResult<AdminCommissionRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('commissions')
    .select(`
      id, deal_id, seller_id, amount, vat_amount, total, status, due_date, paid_at, dispute_reason, created_at, payment_method, bank_receipt_url, commission_rate,
      seller:profiles!commissions_seller_id_fkey(full_name, company_name_ar, company_name_en, email),
      deal:deals!commissions_deal_id_fkey(deal_type, value, status)
    `, { count: 'exact' });

  if (params.filters?.status) query = query.eq('status', params.filters.status);

  const sort = parseSortParam(params.sort);
  if (sort && ['created_at', 'due_date', 'amount', 'total', 'status'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  const rows = (data ?? []).map((c: Record<string, unknown>) => {
    const seller = c.seller as Record<string, string> | null;
    const deal = c.deal as Record<string, unknown> | null;
    return {
      id: c.id as string,
      deal_id: c.deal_id as string,
      seller_id: c.seller_id as string,
      amount: c.amount as number,
      vat_amount: c.vat_amount as number,
      total: c.total as number,
      status: c.status as string,
      due_date: c.due_date as string | null,
      paid_at: c.paid_at as string | null,
      dispute_reason: c.dispute_reason as string | null,
      created_at: c.created_at as string,
      seller_name: seller?.full_name ?? null,
      seller_company: seller?.company_name_ar ?? seller?.company_name_en ?? null,
      seller_email: seller?.email ?? null,
      deal_type: (deal?.deal_type as string) ?? null,
      deal_value: deal?.value != null ? Number(deal.value) : null,
      deal_status: (deal?.status as string) ?? null,
      payment_method: c.payment_method as string | null,
      bank_receipt_url: resolveReceiptUrl(c.bank_receipt_url as string | null),
      commission_rate: c.commission_rate as number | null,
    };
  });

  return {
    data: rows,
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
    db(supabase).from('commissions').select('id', { count: 'exact' }).eq('status', 'pending'),
    db(supabase).from('commissions').select('id', { count: 'exact' }).eq('status', 'disputed'),
    db(supabase).from('commissions').select('id', { count: 'exact' }).eq('status', 'overdue'),
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
  // Additional detail fields
  base_price: number | null;
  duration_months: number | null;
  duration_discount: number | null;
  coupon_discount: number | null;
  coupon_code: string | null;
  moyasar_payment_id: string | null;
  user_email: string | null;
  user_role: string | null;
}

export async function getAdminSubscriptions(params: AdminQueryParams): Promise<PaginatedResult<AdminSubscriptionRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('subscriptions')
    .select('id, user_id, tier, is_active, payment_status, payment_method, starts_at, expires_at, final_price, base_price, duration_months, duration_discount, coupon_discount, coupon_id, moyasar_payment_id, created_at, profiles:user_id(full_name, bank_receipt_url, role), coupons:coupon_id(code)', { count: 'exact' });

  if (params.filters?.tier) query = query.eq('tier', params.filters.tier);
  if (params.filters?.status === 'active') query = query.eq('is_active', true);
  if (params.filters?.status === 'expired') query = query.eq('is_active', false);
  if (params.filters?.status === 'pending') query = query.eq('payment_status', 'pending');

  if (params.search) {
    const s = params.search.replace(/[%_]/g, '');
    query = query.ilike('profiles.full_name', `%${s}%`);
  }

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
    const coupon = sub.coupons as Record<string, string> | null;
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
      bank_receipt_url: resolveReceiptUrl(profiles?.bank_receipt_url ?? null),
      payment_method: sub.payment_method as string | null,
      base_price: sub.base_price != null ? Number(sub.base_price) : null,
      duration_months: sub.duration_months != null ? Number(sub.duration_months) : null,
      duration_discount: sub.duration_discount != null ? Number(sub.duration_discount) : null,
      coupon_discount: sub.coupon_discount != null ? Number(sub.coupon_discount) : null,
      coupon_code: coupon?.code ?? null,
      moyasar_payment_id: (sub.moyasar_payment_id as string) ?? null,
      user_email: null,
      user_role: profiles?.role ?? null,
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
    db(supabase).from('subscriptions').select('id', { count: 'exact' }).eq('tier', 'starter').eq('is_active', true),
    db(supabase).from('subscriptions').select('id', { count: 'exact' }).eq('tier', 'pro').eq('is_active', true),
    db(supabase).from('subscriptions').select('id', { count: 'exact' }).eq('tier', 'business').eq('is_active', true),
    db(supabase).from('subscriptions').select('id', { count: 'exact' }).eq('tier', 'enterprise').eq('is_active', true),
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
  quality_rating: number | null;
  timeliness_rating: number | null;
  communication_rating: number | null;
  would_recommend: boolean | null;
  comment_ar: string | null;
  comment_en: string | null;
  is_hidden: boolean;
  created_at: string;
  // Joined fields
  reviewer_name: string | null;
  reviewer_company: string | null;
  reviewee_name: string | null;
  reviewee_company: string | null;
  deal_type: string | null;
  deal_value: number | null;
}

export async function getAdminReviews(params: AdminQueryParams): Promise<PaginatedResult<AdminReviewRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('reviews')
    .select(`
      id, deal_id, reviewer_id, reviewee_id, overall_rating, quality_rating, timeliness_rating, communication_rating, would_recommend, comment_ar, comment_en, is_hidden, created_at,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name, company_name_ar, company_name_en),
      reviewee:profiles!reviews_reviewee_id_fkey(full_name, company_name_ar, company_name_en),
      deal:deals!reviews_deal_id_fkey(deal_type, value)
    `, { count: 'exact' });

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

  const rows = (data ?? []).map((r: Record<string, unknown>) => {
    const reviewer = r.reviewer as Record<string, string> | null;
    const reviewee = r.reviewee as Record<string, string> | null;
    const deal = r.deal as Record<string, unknown> | null;
    return {
      id: r.id as string,
      deal_id: r.deal_id as string,
      reviewer_id: r.reviewer_id as string,
      reviewee_id: r.reviewee_id as string,
      overall_rating: r.overall_rating as number,
      quality_rating: (r.quality_rating as number) ?? null,
      timeliness_rating: (r.timeliness_rating as number) ?? null,
      communication_rating: (r.communication_rating as number) ?? null,
      would_recommend: (r.would_recommend as boolean) ?? null,
      comment_ar: r.comment_ar as string | null,
      comment_en: r.comment_en as string | null,
      is_hidden: r.is_hidden as boolean,
      created_at: r.created_at as string,
      reviewer_name: reviewer?.full_name ?? null,
      reviewer_company: reviewer?.company_name_ar ?? reviewer?.company_name_en ?? null,
      reviewee_name: reviewee?.full_name ?? null,
      reviewee_company: reviewee?.company_name_ar ?? reviewee?.company_name_en ?? null,
      deal_type: (deal?.deal_type as string) ?? null,
      deal_value: deal?.value != null ? Number(deal.value) : null,
    };
  });

  return {
    data: rows,
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
    db(supabase).from('reviews').select('id', { count: 'exact' }),
    db(supabase).from('reviews').select('id', { count: 'exact' }).eq('is_hidden', true),
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

// ------- Payments -------

export type AdminPaymentRow = AdminSubscriptionRow;

export interface PaymentStats {
  pending: number;
  completed: number;
  failed: number;
}

export async function getAdminPayments(params: AdminQueryParams): Promise<PaginatedResult<AdminPaymentRow>> {
  const supabase = await verifyAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = db(supabase)
    .from('subscriptions')
    .select('id, user_id, tier, is_active, payment_status, payment_method, starts_at, expires_at, final_price, base_price, duration_months, duration_discount, coupon_discount, coupon_id, moyasar_payment_id, created_at, profiles:user_id(full_name, bank_receipt_url, role), coupons:coupon_id(code)', { count: 'exact' });

  // Filter by payment status
  if (params.filters?.status === 'pending') query = query.eq('payment_status', 'pending');
  else if (params.filters?.status === 'completed') query = query.eq('payment_status', 'completed');
  else if (params.filters?.status === 'failed') query = query.eq('payment_status', 'failed');

  // Filter by payment method
  if (params.filters?.method) query = query.eq('payment_method', params.filters.method);

  // Search by user name
  if (params.search) {
    const s = params.search.replace(/[%_]/g, '');
    query = query.ilike('profiles.full_name', `%${s}%`);
  }

  const sort = parseSortParam(params.sort);
  if (sort && ['created_at', 'final_price', 'expires_at'].includes(sort.column)) {
    query = query.order(sort.column, { ascending: sort.ascending });
  } else {
    // Default: pending first, then newest
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  const rows = (data ?? []).map((sub: Record<string, unknown>) => {
    const profiles = sub.profiles as Record<string, string> | null;
    const coupon = sub.coupons as Record<string, string> | null;
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
      bank_receipt_url: resolveReceiptUrl(profiles?.bank_receipt_url ?? null),
      payment_method: sub.payment_method as string | null,
      base_price: sub.base_price != null ? Number(sub.base_price) : null,
      duration_months: sub.duration_months != null ? Number(sub.duration_months) : null,
      duration_discount: sub.duration_discount != null ? Number(sub.duration_discount) : null,
      coupon_discount: sub.coupon_discount != null ? Number(sub.coupon_discount) : null,
      coupon_code: coupon?.code ?? null,
      moyasar_payment_id: (sub.moyasar_payment_id as string) ?? null,
      user_email: null,
      user_role: profiles?.role ?? null,
    };
  });

  return {
    data: rows,
    totalCount: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAdminPaymentStats(): Promise<PaymentStats> {
  const supabase = await verifyAdmin();
  const [
    { count: pending },
    { count: completed },
    { count: failed },
  ] = await Promise.all([
    db(supabase).from('subscriptions').select('id', { count: 'exact' }).eq('payment_status', 'pending'),
    db(supabase).from('subscriptions').select('id', { count: 'exact' }).eq('payment_status', 'completed'),
    db(supabase).from('subscriptions').select('id', { count: 'exact' }).eq('payment_status', 'failed'),
  ]);
  return {
    pending: pending ?? 0,
    completed: completed ?? 0,
    failed: failed ?? 0,
  };
}
