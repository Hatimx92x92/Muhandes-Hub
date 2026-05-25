import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminUserActions } from '@/components/features/admin/user-actions';
import { AdminProfileEditForm } from '@/components/features/admin/user-profile-edit';
import { AdminAuthControls } from '@/components/features/admin/user-auth-controls';
import { AdminUserEntities } from '@/components/features/admin/user-entities';
import { SubscriptionManagerButton } from '@/components/features/admin/subscription-manager';
import { PaymentActionButtons } from '@/components/features/admin/payment-action-buttons';
import { AdminDocumentActions } from '@/components/features/admin/document-actions';
import { getFullUserDetails } from '@/actions/admin/users';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { formatDate, formatSAR } from '@/lib/utils';
import { getProxyUrl } from '@/lib/file-utils';
import { FileActions } from '@/components/features/file-actions';
import {
  Shield,
  FileText,
  Star,
  Handshake,
  Package,
  Gavel,
  Eye,
  CreditCard,
  Receipt,
  Download,
  Image,
} from 'lucide-react';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.userDetail');
  const tAdmin = await getTranslations('admin');
  const { data, error } = await getFullUserDetails(id);
  if (error || !data) redirect('/admin/users');

  const auth = data.auth as Record<string, unknown>;
  const profile = data.profile as Record<string, unknown>;
  const subscription = data.subscription as Record<string, unknown> | null;
  const subscriptions = data.subscriptions as Record<string, unknown>[];
  const invoices = data.invoices as Record<string, unknown>[];
  const documents = data.documents as Record<string, unknown>[];
  const activity = data.activity as Record<string, number>;

  // Receipt URL is on the profile, not on subscriptions
  const profileReceiptUrl = (profile?.bank_receipt_url as string) || null;
  const isReceiptImage = profileReceiptUrl ? /\.(jpg|jpeg|png|gif|webp)$/i.test(profileReceiptUrl) : false;

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
                paymentStatus={(subscription?.payment_status as string) ?? null}
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
                  {formatSAR(Number(subscription.final_price ?? subscription.base_price ?? 0), locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('endDate')}</p>
                <p className="text-sm mt-1">
                  {subscription.expires_at
                    ? formatDate(subscription.expires_at as string, locale, { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noSubscription')}</p>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Payment Records & Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            {t('paymentRecords')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Payment History */}
          {subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-start text-xs text-muted-foreground">
                    <th className="pb-2 pe-4 font-medium">{t('tier')}</th>
                    <th className="pb-2 pe-4 font-medium">{t('paymentMethod')}</th>
                    <th className="pb-2 pe-4 font-medium">{t('paymentStatus')}</th>
                    <th className="pb-2 pe-4 font-medium">{t('price')}</th>
                    <th className="pb-2 pe-4 font-medium">{t('startDate')}</th>
                    <th className="pb-2 pe-4 font-medium">{t('endDate')}</th>
                    <th className="pb-2 font-medium">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => {
                    const pm = sub.payment_method as string;
                    const ps = sub.payment_status as string;
                    return (
                      <tr key={sub.id as string} className="border-b border-border last:border-0">
                        <td className="py-2 pe-4">
                          <Badge variant={(sub.tier as string) as 'starter' | 'pro' | 'business' | 'enterprise'}>
                            {tAdmin(`subscriptionTier.${sub.tier as string}`)}
                          </Badge>
                        </td>
                        <td className="py-2 pe-4">
                          <Badge variant="outline">
                            {pm === 'card' ? t('pmCard') : pm === 'bank_transfer' ? t('pmBankTransfer') : t('pmFree')}
                          </Badge>
                        </td>
                        <td className="py-2 pe-4">
                          <Badge variant={ps === 'completed' ? 'success' : ps === 'failed' ? 'destructive' : 'pending'}>
                            {ps === 'completed' ? t('psCompleted') : ps === 'failed' ? t('psFailed') : t('psPending')}
                          </Badge>
                        </td>
                        <td className="py-2 pe-4 font-medium">
                          {formatSAR(Number(sub.final_price ?? sub.base_price ?? 0), locale)}
                        </td>
                        <td className="py-2 pe-4 text-muted-foreground">
                          {sub.starts_at ? formatDate(sub.starts_at as string, locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="py-2 pe-4 text-muted-foreground">
                          {sub.expires_at ? formatDate(sub.expires_at as string, locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <PaymentActionButtons
                              subscriptionId={sub.id as string}
                              paymentStatus={ps}
                            />
                            {pm === 'bank_transfer' && profileReceiptUrl && (
                              <a
                                href={getProxyUrl(profileReceiptUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <Eye className="h-3 w-3" />
                                {t('viewReceipt')}
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noPayments')}</p>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold">{t('invoiceNumber').replace(' #', '')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-start text-xs text-muted-foreground">
                      <th className="pb-2 pe-4 font-medium">{t('invoiceNumber')}</th>
                      <th className="pb-2 pe-4 font-medium">{t('type')}</th>
                      <th className="pb-2 pe-4 font-medium">{t('subtotal')}</th>
                      <th className="pb-2 pe-4 font-medium">{t('vat')}</th>
                      <th className="pb-2 pe-4 font-medium">{t('invoiceTotal')}</th>
                      <th className="pb-2 pe-4 font-medium">{t('invoiceDate')}</th>
                      <th className="pb-2 font-medium">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id as string} className="border-b border-border last:border-0">
                        <td className="py-2 pe-4 font-mono text-xs">{inv.number as string}</td>
                        <td className="py-2 pe-4">
                          <Badge variant="outline">{inv.type as string}</Badge>
                        </td>
                        <td className="py-2 pe-4">
                          {Number(inv.subtotal ?? 0).toFixed(2)} {t('currency')}
                        </td>
                        <td className="py-2 pe-4">
                          {Number(inv.vat ?? 0).toFixed(2)} {t('currency')}
                        </td>
                        <td className="py-2 pe-4 font-medium">
                          {formatSAR(Number(inv.total ?? 0), locale)}
                        </td>
                        <td className="py-2 pe-4 text-muted-foreground">
                          {inv.issued_at ? formatDate(inv.issued_at as string, locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="py-2">
                          <a
                            href={`/api/pdf/invoice/${inv.id as string}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            {t('downloadInvoice')}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inline Receipt Viewer (collapsible) */}
          {profileReceiptUrl && (
            <details className="group">
              <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <Image className="h-4 w-4" />
                {t('viewReceipt')}
                <span className="ms-1 text-xs text-muted-foreground transition-transform group-open:rotate-90">▶</span>
              </summary>
              <div className="overflow-hidden rounded-lg border border-border">
                {isReceiptImage ? (
                  <img
                    src={getProxyUrl(profileReceiptUrl)}
                    alt="Bank transfer receipt"
                    className="max-h-[500px] w-full object-contain bg-muted"
                  />
                ) : (
                  <object
                    data={getProxyUrl(profileReceiptUrl)}
                    type="application/pdf"
                    className="h-[500px] w-full"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                      <p className="text-sm text-muted-foreground">Unable to display PDF inline</p>
                      <a
                        href={getProxyUrl(profileReceiptUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {t('viewReceipt')} →
                      </a>
                    </div>
                  </object>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Section 6 — Activity Summary */}
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
        <CardContent className="space-y-4">
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
                      {t('uploadedAt')}: {formatDate(doc.created_at as string, locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                      {!!doc.reviewed_at && (
                        <> • {t('reviewedAt')}: {formatDate(doc.reviewed_at as string, locale, { year: 'numeric', month: 'short', day: 'numeric' })}</>
                      )}
                    </p>
                  </div>
                  {!!doc.signed_url && (
                    <a
                      href={getProxyUrl(doc.signed_url as string)}
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

          <AdminDocumentActions
            userId={id}
            hasPendingDocs={documents.some((d) => d.status === 'pending')}
          />
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
