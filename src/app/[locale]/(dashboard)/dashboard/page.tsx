// =============================================================================
// Dashboard Overview Page — dispatches to role-specific dashboard components
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import type { UserRole } from '@/types';
import { OnboardingChecklist } from '@/components/features/onboarding/onboarding-checklist';
import {
  BuyerDashboard,
  ProjectOwnerDashboard,
  ContractorDashboard,
  SupplierDashboard,
} from '@/components/features/dashboard';
import { getDashboardActivity } from '@/actions/analytics';
import { setRequestLocale } from 'next-intl/server';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const t = await getTranslations('dashboard');
  const tStats = await getTranslations('dashboard.stats');
  const tActions = await getTranslations('dashboard.actions');

  // Fetch user role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    db.from('profiles').select('role, full_name, onboarding_progress').eq('id', user.id).single(),
    db.from('subscriptions').select('tier').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
  ]);

  const role = (profile?.role as UserRole) || 'buyer';
  const subscriptionTier = subscription?.tier ?? null;

  // Fetch real counts for stat cards — role-specific queries
  const counts: Record<string, number> = {};

  const countQuery = async (table: string, filter?: Record<string, string>) => {
    let q = db.from(table).select('id', { count: 'exact' });
    if (filter) {
      for (const [k, v] of Object.entries(filter)) {
        q = q.eq(k, v);
      }
    }
    const { count } = await q;
    return count ?? 0;
  };

  const dealsCount = () =>
    db.from('deals').select('id', { count: 'exact' })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .then((r: { count: number | null }) => r.count ?? 0);

  const reviewsCount = () =>
    db.from('reviews').select('id', { count: 'exact' })
      .or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`)
      .then((r: { count: number | null }) => r.count ?? 0);

  if (role === 'project_owner') {
    const [projects, bids, deals, rfqs, reviews] = await Promise.all([
      countQuery('projects', { owner_id: user.id }),
      (async () => {
        const { data: myProjects } = await db.from('projects').select('id').eq('owner_id', user.id);
        if (!myProjects?.length) return 0;
        const { count } = await db.from('bids').select('id', { count: 'exact' })
          .in('project_id', myProjects.map((p: { id: string }) => p.id));
        return count ?? 0;
      })(),
      dealsCount(),
      countQuery('rfqs', { poster_id: user.id }),
      reviewsCount(),
    ]);
    Object.assign(counts, { projects, bids, deals, rfqs, reviews });
  } else if (role === 'contractor') {
    const [projects, bids, deals, reviews, sentInquiries] = await Promise.all([
      countQuery('projects', { owner_id: user.id }),
      countQuery('bids', { contractor_id: user.id }),
      dealsCount(),
      reviewsCount(),
      countQuery('inquiries', { sender_id: user.id }),
    ]);
    Object.assign(counts, { projects, bids, deals, reviews, sentInquiries });
  } else if (role === 'supplier') {
    const [products, quotations, inquiries, deals, reviews] = await Promise.all([
      countQuery('products', { supplier_id: user.id }),
      countQuery('quotations', { sender_id: user.id }),
      countQuery('inquiries', { recipient_id: user.id }),
      dealsCount(),
      reviewsCount(),
    ]);
    Object.assign(counts, { products, quotations, inquiries, deals, reviews });
  } else if (role === 'buyer') {
    const [rfqs, deals, quotations, inquiries] = await Promise.all([
      countQuery('rfqs', { poster_id: user.id }),
      dealsCount(),
      (async () => {
        const { data: myRfqs } = await db.from('rfqs').select('id').eq('poster_id', user.id);
        if (!myRfqs?.length) return 0;
        const { count } = await db.from('quotations').select('id', { count: 'exact' })
          .in('rfq_id', myRfqs.map((r: { id: string }) => r.id));
        return count ?? 0;
      })(),
      countQuery('inquiries', { sender_id: user.id }),
    ]);
    Object.assign(counts, { rfqs, deals, quotations, inquiries });
  }

  const activityResult = await getDashboardActivity();
  const activities = activityResult.data ?? [];
  const greeting = profile?.full_name
    ? t('greeting', { name: profile.full_name })
    : t('greetingDefault');

  // Shared props for all role dashboards
  const sharedProps = {
    counts,
    activities,
    locale,
    t: (key: string) => t(key),
    tStats: (key: string) => tStats(key),
    tActions: (key: string) => tActions(key),
  };

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{greeting}</h1>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {t(`role.${role}`)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('overview')}
        </p>
      </div>

      {/* Onboarding Checklist */}
      <div className="mb-8">
        <OnboardingChecklist
          role={role}
          progress={(profile?.onboarding_progress as Record<string, boolean>) || {}}
          emailVerified={!!user.email_confirmed_at}
        />
      </div>

      {/* Role-specific dashboard content */}
      {role === 'buyer' && <BuyerDashboard {...sharedProps} />}
      {role === 'project_owner' && <ProjectOwnerDashboard {...sharedProps} />}
      {role === 'contractor' && (
        <ContractorDashboard {...sharedProps} subscriptionTier={subscriptionTier} />
      )}
      {role === 'supplier' && (
        <SupplierDashboard {...sharedProps} subscriptionTier={subscriptionTier} />
      )}
    </div>
  );
}
