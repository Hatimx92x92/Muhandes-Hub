// =============================================================================
// Invitations Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth-guards';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getLocaleField, getEntitySlug } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { CreateInviteModal } from '@/components/features/invitations/create-invite-modal';
import { ReceivedQuoteInvitations } from '@/components/features/invitations/received-quote-invitations';
import { ReceivedBidInvitations } from '@/components/features/invitations/received-bid-invitations';
import { EmptyState } from '@/components/features/empty-state';
import { AlertCircle } from 'lucide-react';
import { InvitationsTableClient, type SentInvitationRow } from './invitations-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function InvitationsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;

  // Role guard — buyer excluded from invitations
  const { user, profile, supabase } = await requireRole(['project_owner', 'contractor', 'supplier']);

  const t = await getTranslations('dashboard.invitations');
  const tCommon = await getTranslations('dashboard.common');

  const role = profile.role as string;
  const isPO = role === 'project_owner';
  const isSupplier = role === 'supplier';
  const isContractor = role === 'contractor';

  // ── Data fetching based on role ────────────────────────────────────────

  // PO: fetch published projects for modal selectors
  let myProjects: { id: string; title: string }[] = [];
  if (isPO) {
    const { data: projects } = await db(supabase)
      .from('projects')
      .select('id, title_ar, title_en')
      .eq('owner_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    myProjects = (projects ?? []).map((p: Record<string, string>) => ({
      id: p.id,
      title: getLocaleField(p, 'title', locale),
    }));
  }

  // PO: fetch suppliers for invite-to-quote
  let suppliers: { id: string; companyName: string }[] = [];
  if (isPO) {
    const { data: supplierProfiles } = await db(supabase)
      .from('profiles')
      .select('id, company_name_ar, company_name_en')
      .eq('role', 'supplier')
      .eq('verification_status', 'verified')
      .order('company_name_ar')
      .limit(200);

    suppliers = (supplierProfiles ?? []).map((s: Record<string, string>) => ({
      id: s.id,
      companyName: getLocaleField(s, 'company_name', locale),
    }));
  }

  // PO: fetch contractors for invite-to-bid
  let contractors: { id: string; companyName: string }[] = [];
  if (isPO) {
    const { data: contractorProfiles } = await db(supabase)
      .from('profiles')
      .select('id, company_name_ar, company_name_en')
      .eq('role', 'contractor')
      .eq('verification_status', 'verified')
      .order('company_name_ar')
      .limit(200);

    contractors = (contractorProfiles ?? []).map((c: Record<string, string>) => ({
      id: c.id,
      companyName: getLocaleField(c, 'company_name', locale),
    }));
  }

  // PO: sent invitations (always shown for PO)
  interface SentInvitation {
    id: string;
    supplier_id: string;
    project_id: string;
    description_ar: string;
    description_en: string | null;
    status: string;
    created_at: string;
    profiles: { company_name_ar: string; company_name_en: string | null; role: string } | null;
    projects: { title_ar: string; title_en: string | null } | null;
  }
  let sentInvitations: SentInvitation[] = [];
  let sentTotalCount = 0;
  let sentTotalPages = 0;

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const sort = params.sort || '';
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  if (isPO) {
    let query = db(supabase)
      .from('hire_requests')
      .select('id, supplier_id, project_id, description_ar, description_en, status, created_at, profiles!hire_requests_supplier_id_fkey(company_name_ar, company_name_en, role), projects(title_ar, title_en)', { count: 'exact' })
      .eq('requester_id', user.id)
      .order(sortConfig.column, { ascending: sortConfig.ascending });

    if (params.status) query = query.eq('status', params.status);

    const { data, count } = await query.range((page - 1) * perPage, page * perPage - 1);
    sentInvitations = (data ?? []) as SentInvitation[];
    sentTotalCount = count ?? 0;
    sentTotalPages = Math.ceil(sentTotalCount / perPage);
  }

  // Supplier: received quote invitations
  interface ReceivedInvitation {
    id: string;
    requester_id: string;
    project_id: string;
    description_ar: string;
    description_en: string | null;
    status: string;
    created_at: string;
    profiles: { company_name_ar: string; company_name_en: string | null } | null;
    projects: { title_ar: string; title_en: string | null } | null;
  }
  let receivedQuoteInvitations: ReceivedInvitation[] = [];
  if (isSupplier) {
    const { data } = await db(supabase)
      .from('hire_requests')
      .select('id, requester_id, project_id, description_ar, description_en, status, created_at, profiles!hire_requests_requester_id_fkey(company_name_ar, company_name_en), projects(title_ar, title_en)')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    receivedQuoteInvitations = (data ?? []) as ReceivedInvitation[];
  }

  // Contractor: received bid invitations
  let receivedBidInvitations: ReceivedInvitation[] = [];
  if (isContractor) {
    const { data } = await db(supabase)
      .from('hire_requests')
      .select('id, requester_id, project_id, description_ar, description_en, status, created_at, profiles!hire_requests_requester_id_fkey(company_name_ar, company_name_en), projects(title_ar, title_en, slug_ar, slug_en)')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    receivedBidInvitations = (data ?? []) as ReceivedInvitation[];
  }

  const hasPublishedProjects = myProjects.length > 0;

  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: [
        { value: 'pending', label: t('status_pending') },
        { value: 'accepted', label: t('status_accepted') },
        { value: 'declined', label: t('status_declined') },
        { value: 'cancelled', label: t('status_cancelled') },
      ],
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Create Invite CTA for PO */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        {isPO && (
          <CreateInviteModal
            projects={myProjects}
            suppliers={suppliers}
            contractors={contractors}
            hasPublishedProjects={hasPublishedProjects}
          />
        )}
      </div>

      {/* PO: No published projects warning */}
      {isPO && !hasPublishedProjects && (
        <Card className="flex items-center gap-3 border-warning/30 bg-warning/5 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-muted-foreground">{t('noProjectsWarning')}</p>
        </Card>
      )}

      {/* ── PO: Sent Invitations Table ──────────────────────────────────── */}
      {isPO && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t('tabSent')}</h2>
          <InvitationsTableClient
            items={sentInvitations.map((inv) => {
              const inviteeName = getLocaleField(inv.profiles ?? {}, 'company_name', locale);
              const projectTitle = getLocaleField(inv.projects ?? {}, 'title', locale);
              const isContractorInvite = (inv.profiles as SentInvitation['profiles'])?.role === 'contractor';

              return {
                id: inv.id,
                type: isContractorInvite ? 'bid' : 'quote',
                project_title: projectTitle,
                recipient_name: inviteeName,
                created_at: inv.created_at,
                status: inv.status,
              } satisfies SentInvitationRow;
            })}
            locale={locale}
            totalCount={sentTotalCount}
            currentPage={page}
            totalPages={sentTotalPages}
            filterGroups={filterGroups}
            sortOptions={sortOptions}
            translations={{
              colType: t('colType'),
              colProject: t('colProject'),
              colRecipient: t('colRecipient'),
              colDate: t('colDate'),
              colStatus: t('colStatus'),
              typeBid: t('typeBid'),
              typeQuote: t('typeQuote'),
              noSentInvitations: t('noSentInvitations'),
              noSentInvitationsDesc: t('noSentInvitationsDesc'),
              status_pending: t('status_pending'),
              status_accepted: t('status_accepted'),
              status_declined: t('status_declined'),
              status_cancelled: t('status_cancelled'),
            }}
          />
        </div>
      )}

      {/* ── Supplier: Received Quote Invitations ──────────────────────── */}
      {isSupplier && (
        <ReceivedQuoteInvitations
          invitations={receivedQuoteInvitations.map((inv) => ({
            id: inv.id,
            requester_id: inv.requester_id,
            requester_name: getLocaleField(inv.profiles ?? {}, 'company_name', locale),
            project_id: inv.project_id,
            project_title: getLocaleField(inv.projects ?? {}, 'title', locale),
            description_ar: inv.description_ar,
            description_en: inv.description_en,
            status: inv.status,
            created_at: inv.created_at,
          }))}
        />
      )}

      {/* ── Contractor: Received Bid Invitations ─────────────────────── */}
      {isContractor && (
        <ReceivedBidInvitations
          invitations={receivedBidInvitations.map((inv) => ({
            id: inv.id,
            requester_id: inv.requester_id,
            requester_name: getLocaleField(inv.profiles ?? {}, 'company_name', locale),
            project_id: inv.project_id,
            project_title: getLocaleField(inv.projects ?? {}, 'title', locale),
            project_slug: inv.projects ? getEntitySlug(inv.projects as { slug_ar?: string | null; slug_en?: string | null }, locale) : '',
            description_ar: inv.description_ar,
            description_en: inv.description_en,
            status: inv.status,
            created_at: inv.created_at,
          }))}
        />
      )}
    </div>
  );
}
