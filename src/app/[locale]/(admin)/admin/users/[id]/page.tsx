import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminUserActions } from '@/components/features/admin/user-actions';
import { getFullUserDetails } from '@/actions/admin/users';
import {
  ArrowRight,
  Mail,
  Phone,
  Shield,
  Globe,
  Calendar,
  Briefcase,
  FileText,
  Star,
  Handshake,
  Package,
  Gavel,
  Eye,
  Lock,
  User,
  Building2,
  Hash,
  CreditCard,
  MapPin,
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          {t('backToUsers')}
        </Link>
        <ArrowRight className="h-3 w-3 text-muted-foreground rtl:rotate-180" />
        <span className="text-sm font-medium">{t('title')}</span>
      </div>

      {/* Header with actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {(profile?.full_name_ar as string) ?? (profile?.full_name_en as string) ?? t('notProvided')}
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

      {/* Auth Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            {t('authInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('email')}</p>
                <p className="text-sm font-medium">{auth.email as string}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('phone')}</p>
                <p className="text-sm font-medium">{(auth.phone as string) || t('notProvided')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('provider')}</p>
                <p className="text-sm font-medium capitalize">{auth.provider as string}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('emailVerified')}</p>
                <Badge variant={auth.emailConfirmed ? 'success' : 'warning'} className="mt-0.5">
                  {auth.emailConfirmed ? t('yes') : t('no')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('lastSignIn')}</p>
                <p className="text-sm font-medium">
                  {auth.lastSignIn
                    ? new Date(auth.lastSignIn as string).toLocaleString(locale)
                    : t('never')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('createdAt')}</p>
                <p className="text-sm font-medium">
                  {auth.createdAt
                    ? new Date(auth.createdAt as string).toLocaleString(locale)
                    : t('notProvided')}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <Lock className="me-1 inline h-3 w-3" />
              Password: [hashed — not viewable]
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t('profileInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('fullName')}</p>
                <p className="text-sm font-medium">{(profile?.full_name_ar as string) ?? (profile?.full_name_en as string) ?? t('notProvided')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('companyName')}</p>
                <p className="text-sm font-medium">
                  {locale === 'ar'
                    ? (profile?.company_name_ar as string) ?? (profile?.company_name_en as string) ?? t('notProvided')
                    : (profile?.company_name_en as string) ?? (profile?.company_name_ar as string) ?? t('notProvided')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('role')}</p>
                <p className="text-sm font-medium">
                  {profile?.role ? tAdmin(`roleLabels.${profile.role as string}`) : t('notProvided')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('crNumber')}</p>
                <p className="text-sm font-medium">{(profile?.cr_number as string) ?? t('notProvided')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('vatNumber')}</p>
                <p className="text-sm font-medium">{(profile?.vat_number as string) ?? t('notProvided')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('website')}</p>
                <p className="text-sm font-medium">{(profile?.website as string) ?? t('notProvided')}</p>
              </div>
            </div>
            {!!profile?.city && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('city')}</p>
                  <p className="text-sm font-medium">{profile.city as string}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status + Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            {t('verificationStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pipeline steps */}
          <div className="flex flex-wrap items-center gap-2">
            {['pending_email', 'pending_payment', 'pending_documents', 'pending_approval', 'active'].map((step, i) => {
              const current = profile?.verification_status as string;
              const steps = ['pending_email', 'pending_payment', 'pending_documents', 'pending_approval', 'active'];
              const currentIdx = steps.indexOf(current);
              const stepIdx = i;
              const isCompleted = currentIdx > stepIdx || (current === 'active' && step === 'active');
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

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            {t('subscriptionInfo')}
          </CardTitle>
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

      {/* Activity Summary */}
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

      {/* Verification Documents */}
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
    </div>
  );
}
