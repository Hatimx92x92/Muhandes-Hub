import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminUserActions } from '@/components/features/admin/user-actions';
import { AdminProfileEditForm } from '@/components/features/admin/user-profile-edit';
import { AdminAuthControls } from '@/components/features/admin/user-auth-controls';
import { AdminUserEntities } from '@/components/features/admin/user-entities';
import { SubscriptionManagerButton } from '@/components/features/admin/subscription-manager';
import { getFullUserDetails } from '@/actions/admin/users';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import {
  Shield,
  FileText,
  Star,
  Handshake,
  Package,
  Gavel,
  Eye,
  CreditCard,
} from 'lucide-react';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations('admin.userDetail');
  const tAdmin = await getTranslations('admin');
  const locale = await getLocale();
  const { id } = await params;

  const { data, error } = await getFullUserDetails(id);
  if (error || !data) redirect('/admin/users');

  const auth = data.auth as Record<string, unknown>;
  const profile = data.profile as Record<string, unknown>;
  const subscription = data.subscription as Record<string, unknown> | null;
  const documents = data.documents as Record<string, unknown>[];
  const activity = data.activity as Record<string, number>;

  const STATUS_VARIANTS: Record<string, 'pending' | 'success' | 'destructive' | 'warning' | 'info'> = {
    pending_email: 'pending',
    pending_payment: 'pending',
    pending_documents: 'pending',
    pending_approval: 'warning',
    active: 'success',
    banned: 'destructive',
    restricted: 'warning',
  };

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={id} label={(profile?.full_name as string) ?? ''} />

      {/* Header with actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {(profile?.full_name as string) ?? t('notProvided')}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={STATUS_VARIANTS[(profile?.verification_status as string) ?? ''] ?? 'secondary'}>
              {tAdmin(`userStatus.${profile?.verification_status as string}`)}
            </Badge>
            {!!profile?.role && (
              <Badge variant={(profile.role as string) === 'project_owner' ? 'project_owner' : (profile.role as string) === 'contractor' ? 'contractor' : (profile.role as string) === 'supplier' ? 'supplier' : 'buyer'}>
                {tAdmin(`roleLabels.${profile.role as string}`)}
              </Badge>
            )}
            {!!profile?.is_admin && (
              <Badge variant="info">
                <Shield className="me-1 h-3 w-3" />
                {tAdmin('adminBadge')}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminUserActions
            userId={id}
            currentStatus={(profile?.verification_status as string) ?? ''}
            isAdmin={!!profile?.is_admin}
          />
        </div>
      </div>

      {/* Section 1 — Auth & Access (editable) */}
      <AdminAuthControls
        userId={id}
        auth={auth}
        locale={locale}
        isAdmin={!!profile?.is_admin}
      />

      {/* Section 2 — Profile (editable) */}
      <AdminProfileEditForm
        userId={id}
        profile={profile}
        isAdmin={!!profile?.is_admin}
      />

      {/* Section 3 — Verification Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            {t('verificationStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {['pending_email', 'pending_payment', 'pending_documents', 'pending_approval', 'active'].map((step, i) => {
              const current = profile?.verification_status as string;
              const steps = ['pending_email', 'pending_payment', 'pending_documents', 'pending_approval', 'active'];
              const currentIdx = steps.indexOf(current);
              const isCompleted = currentIdx > i || (current === 'active' && step === 'active');
              const isCurrent = current === step;

              return (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && <div className={`h-0.5 w-6 ${isCompleted ? 'bg-success' : 'bg-border'}`} />}
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    isCompleted ? 'bg-success/10 text-success' :
                    isCurrent ? 'bg-primary/10 text-primary ring-2 ring-primary/20' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {tAdmin(`userStatus.${step}`)}
                  </div>
                </div>
              );
            })}
            {(profile?.verification_status === 'banned' || profile?.verification_status === 'restricted') && (
              <Badge variant={profile.verification_status === 'banned' ? 'destructive' : 'warning'} className="ms-4">
                {tAdmin(`userStatus.${profile.verification_status as string}`)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Subscription + Manager */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              {t('subscriptionInfo')}
            </CardTitle>
            {!profile?.is_admin && (
              <SubscriptionManagerButton
                userId={id}
                currentTier={(subscription?.tier as string) ?? (profile?.subscription_tier as string) ?? 'starter'}
                currentStatus={subscription?.is_active ? 'active' : 'expired'}
                subscriptionId={(subscription?.id as string) ?? ''}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('currentTier')}</p>
                <Badge variant={(subscription.tier as string) as 'starter' | 'pro' | 'business' | 'enterprise'} className="mt-1">
                  {tAdmin(`subscriptionTier.${subscription.tier as string}`)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('subscriptionStatus')}</p>
                <Badge variant={subscription.is_active ? 'success' : 'warning'} className="mt-1">
                  {subscription.is_active ? tAdmin('subscriptionStatus.active') : tAdmin('subscriptionStatus.expired')}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('amount')}</p>
                <p className="text-sm font-semibold mt-1">
                  {Number(subscription.final_price ?? subscription.base_price ?? 0).toLocaleString(locale)} {tAdmin('sar')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('endDate')}</p>
                <p className="text-sm mt-1">
                  {subscription.expires_at
                    ? new Date(subscription.expires_at as string).toLocaleDateString(locale)
                    : '—'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noSubscription')}</p>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            {t('activitySummary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: t('totalDeals'), value: activity.totalDeals, icon: Handshake },
              { label: t('totalProjects'), value: activity.totalProjects, icon: FileText },
              { label: t('totalProducts'), value: activity.totalProducts, icon: Package },
              { label: t('totalBids'), value: activity.totalBids, icon: Gavel },
              { label: t('totalReviews'), value: activity.totalReviews, icon: Star },
              { label: t('avgRating'), value: activity.avgRating > 0 ? `${activity.avgRating}/5` : '—', icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 6 — Verification Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {t('verificationDocs')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noDocs')}</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id as string} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{doc.doc_type as string}</span>
                      <Badge variant={
                        doc.status === 'approved' ? 'success' :
                        doc.status === 'rejected' ? 'destructive' :
                        'pending'
                      }>
                        {String(doc.status)}
                      </Badge>
                    </div>
                    {!!doc.admin_notes_ar && (
                      <p className="text-xs text-muted-foreground">{t('adminNotes')}: {doc.admin_notes_ar as string}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('uploadedAt')}: {new Date(doc.created_at as string).toLocaleDateString(locale)}
                      {!!doc.reviewed_at && (
                        <> • {t('reviewedAt')}: {new Date(doc.reviewed_at as string).toLocaleDateString(locale)}</>
                      )}
                    </p>
                  </div>
                  {!!doc.file_url && (
                    <a
                      href={doc.file_url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      {t('viewFile')}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 7 — All Related Entities (Tabbed) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('entityTabs')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUserEntities
            userId={id}
            projects={data.projects as Record<string, unknown>[]}
            products={data.products as Record<string, unknown>[]}
            rfqs={data.rfqs as Record<string, unknown>[]}
            bids={data.bids as Record<string, unknown>[]}
            deals={data.deals as Record<string, unknown>[]}
            quotations={data.quotations as Record<string, unknown>[]}
            reviewsGiven={data.reviewsGiven as Record<string, unknown>[]}
            reviewsReceived={data.reviewsReceived as Record<string, unknown>[]}
            commissions={data.commissions as Record<string, unknown>[]}
            auditEntries={data.auditEntries as Record<string, unknown>[]}
            notifications={data.notifications as Record<string, unknown>[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
