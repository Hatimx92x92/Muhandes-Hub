// =============================================================================
// Invitations Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { getLocaleField, getEntitySlug } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { InviteToQuoteForm } from '@/components/features/invitations/invite-to-quote-form';
import { InviteToBidForm } from '@/components/features/invitations/invite-to-bid-form';
import { ReceivedQuoteInvitations } from '@/components/features/invitations/received-quote-invitations';
import { ReceivedBidInvitations } from '@/components/features/invitations/received-bid-invitations';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Send, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  pending: 'pending',
  accepted: 'published',
  declined: 'rejected',
  cancelled: 'secondary',
};

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.invitations');
  const locale = await getLocale();

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as string;
  const isPO = role === 'project_owner';
  const isSupplier = role === 'supplier';
  const isContractor = role === 'contractor';

  // Default tab based on role
  const tab = params.tab || (isPO ? 'send-quote' : 'received');

  // ── Data fetching based on role & tab ──────────────────────────────────

  // PO: fetch published projects for selectors
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
  if (isPO && tab === 'send-quote') {
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
  if (isPO && tab === 'send-bid') {
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

  // PO: sent invitations
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
  if (isPO && tab === 'sent') {
    const { data } = await db(supabase)
      .from('hire_requests')
      .select('id, supplier_id, project_id, description_ar, description_en, status, created_at, profiles!hire_requests_supplier_id_fkey(company_name_ar, company_name_en, role), projects(title_ar, title_en)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    sentInvitations = (data ?? []) as SentInvitation[];
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

  // Contractor: received bid invitations (stored in hire_requests where supplier_id = contractor)
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

  // ── Tab definitions per role ───────────────────────────────────────────
  const poTabs = [
    { key: 'send-quote', label: t('tabSendQuote') },
    { key: 'send-bid', label: t('tabSendBid') },
    { key: 'sent', label: t('tabSent') },
  ];

  const supplierTabs = [
    { key: 'received', label: t('tabReceived') },
  ];

  const contractorTabs = [
    { key: 'received', label: t('tabReceived') },
  ];

  const tabs = isPO ? poTabs : isSupplier ? supplierTabs : isContractor ? contractorTabs : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>

      {/* Tab navigation */}
      {tabs.length > 1 && (
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tabDef) => (
            <a
              key={tabDef.key}
              href={`?tab=${tabDef.key}`}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === tabDef.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tabDef.label}
            </a>
          ))}
        </div>
      )}

      {/* ── PO: Send Quote Invitation ──────────────────────────────────── */}
      {isPO && tab === 'send-quote' && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('inviteToQuoteTitle')}</h2>
          <p className="mb-6 text-sm text-muted-foreground">{t('inviteToQuoteDesc')}</p>
          <InviteToQuoteForm projects={myProjects} suppliers={suppliers} />
        </Card>
      )}

      {/* ── PO: Send Bid Invitation ────────────────────────────────────── */}
      {isPO && tab === 'send-bid' && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('inviteToBidTitle')}</h2>
          <p className="mb-6 text-sm text-muted-foreground">{t('inviteToBidDesc')}</p>
          <InviteToBidForm projects={myProjects} contractors={contractors} />
        </Card>
      )}

      {/* ── PO: Sent Invitations ───────────────────────────────────────── */}
      {isPO && tab === 'sent' && (
        <div className="space-y-4">
          {sentInvitations.length === 0 ? (
            <EmptyState
              icon={<Send className="h-12 w-12" />}
              title={t('noSentInvitations')}
              description={t('noSentInvitationsDesc')}
            />
          ) : (
            sentInvitations.map((inv) => {
              const inviteeName = getLocaleField(inv.profiles ?? {}, 'company_name', locale);
              const projectTitle = getLocaleField(inv.projects ?? {}, 'title', locale);
              const isContractorInvite = (inv.profiles as SentInvitation['profiles'])?.role === 'contractor';

              return (
                <Card key={inv.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {isContractorInvite ? t('typeBid') : t('typeQuote')}
                        </Badge>
                        <p className="text-sm font-medium text-foreground">{projectTitle}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('to')}: {inviteeName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(inv.created_at, locale)}
                      </p>
                    </div>
                    <Badge variant={statusBadge[inv.status] || 'secondary'}>
                      {t(`status_${inv.status}`)}
                    </Badge>
                  </div>
                </Card>
              );
            })
          )}
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
