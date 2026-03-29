'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import {
  FileText,
  Package,
  ClipboardList,
  Gavel,
  Handshake,
  Receipt,
  Star,
  DollarSign,
  ScrollText,
  Bell,
} from 'lucide-react';

interface AdminUserEntitiesProps {
  userId: string;
  projects: Record<string, unknown>[];
  products: Record<string, unknown>[];
  rfqs: Record<string, unknown>[];
  bids: Record<string, unknown>[];
  deals: Record<string, unknown>[];
  quotations: Record<string, unknown>[];
  reviewsGiven: Record<string, unknown>[];
  reviewsReceived: Record<string, unknown>[];
  commissions: Record<string, unknown>[];
  auditEntries: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
}

const STATUS_VARIANTS: Record<string, 'success' | 'destructive' | 'warning' | 'pending' | 'info' | 'secondary'> = {
  published: 'success',
  active: 'success',
  completed: 'success',
  approved: 'success',
  paid: 'success',
  accepted: 'success',
  sent: 'info',
  viewed: 'info',
  pending: 'pending',
  draft: 'secondary',
  in_progress: 'info',
  shortlisted: 'info',
  awarded: 'success',
  rejected: 'destructive',
  cancelled: 'destructive',
  banned: 'destructive',
  disputed: 'warning',
  expired: 'warning',
  overdue: 'warning',
  closed: 'secondary',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'secondary'} className="text-[10px]">
      {status}
    </Badge>
  );
}

function EntityRow({
  href,
  title,
  status,
  date,
  extra,
}: {
  href: string;
  title: string;
  status?: string;
  date: string;
  extra?: string;
}) {
  const locale = useLocale();
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status && <StatusBadge status={status} />}
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString(locale)}
        </span>
      </div>
    </Link>
  );
}

export function AdminUserEntities({
  projects,
  products,
  rfqs,
  bids,
  deals,
  quotations,
  reviewsGiven,
  reviewsReceived,
  commissions,
  auditEntries,
  notifications,
}: AdminUserEntitiesProps) {
  const t = useTranslations('admin.userDetail');
  const locale = useLocale();

  const getTitle = (item: Record<string, unknown>, fieldAr: string, fieldEn: string) =>
    locale === 'ar'
      ? (item[fieldAr] as string) ?? (item[fieldEn] as string) ?? '—'
      : (item[fieldEn] as string) ?? (item[fieldAr] as string) ?? '—';

  return (
    <Tabs defaultValue="projects">
      <TabsList variant="line" className="mb-4 flex-wrap">
        <TabsTrigger value="projects">
          <FileText className="me-1 h-3 w-3" />
          {t('tabProjects')} ({projects.length})
        </TabsTrigger>
        <TabsTrigger value="products">
          <Package className="me-1 h-3 w-3" />
          {t('tabProducts')} ({products.length})
        </TabsTrigger>
        <TabsTrigger value="rfqs">
          <ClipboardList className="me-1 h-3 w-3" />
          {t('tabRfqs')} ({rfqs.length})
        </TabsTrigger>
        <TabsTrigger value="bids">
          <Gavel className="me-1 h-3 w-3" />
          {t('tabBids')} ({bids.length})
        </TabsTrigger>
        <TabsTrigger value="deals">
          <Handshake className="me-1 h-3 w-3" />
          {t('tabDeals')} ({deals.length})
        </TabsTrigger>
        <TabsTrigger value="quotations">
          <Receipt className="me-1 h-3 w-3" />
          {t('tabQuotations')} ({quotations.length})
        </TabsTrigger>
        <TabsTrigger value="reviewsGiven">
          <Star className="me-1 h-3 w-3" />
          {t('tabReviewsGiven')} ({reviewsGiven.length})
        </TabsTrigger>
        <TabsTrigger value="reviewsReceived">
          <Star className="me-1 h-3 w-3" />
          {t('tabReviewsReceived')} ({reviewsReceived.length})
        </TabsTrigger>
        <TabsTrigger value="commissions">
          <DollarSign className="me-1 h-3 w-3" />
          {t('tabCommissions')} ({commissions.length})
        </TabsTrigger>
        <TabsTrigger value="auditLog">
          <ScrollText className="me-1 h-3 w-3" />
          {t('tabAuditLog')} ({auditEntries.length})
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="me-1 h-3 w-3" />
          {t('tabNotifications')} ({notifications.length})
        </TabsTrigger>
      </TabsList>

      {/* Projects */}
      <TabsContent value="projects">
        {projects.length === 0 ? (
          <EmptyState title={t('noProjects')} icon={<FileText className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <EntityRow
                key={p.id as string}
                href={`/admin/posts/project-${p.id as string}/edit`}
                title={getTitle(p, 'title_ar', 'title_en')}
                status={p.status as string}
                date={p.created_at as string}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Products */}
      <TabsContent value="products">
        {products.length === 0 ? (
          <EmptyState title={t('noProducts')} icon={<Package className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <EntityRow
                key={p.id as string}
                href={`/admin/posts/product-${p.id as string}/edit`}
                title={getTitle(p, 'name_ar', 'name_en')}
                status={p.status as string}
                date={p.created_at as string}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* RFQs */}
      <TabsContent value="rfqs">
        {rfqs.length === 0 ? (
          <EmptyState title={t('noRfqs')} icon={<ClipboardList className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {rfqs.map((r) => (
              <EntityRow
                key={r.id as string}
                href={`/admin/posts/rfq-${r.id as string}/edit`}
                title={getTitle(r, 'title_ar', 'title_en')}
                status={r.status as string}
                date={r.created_at as string}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Bids */}
      <TabsContent value="bids">
        {bids.length === 0 ? (
          <EmptyState title={t('noBids')} icon={<Gavel className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {bids.map((b) => (
              <EntityRow
                key={b.id as string}
                href={`/admin/deals`}
                title={`${t('bidAmount')}: ${Number(b.amount).toLocaleString(locale)} ${t('currency')}`}
                status={b.status as string}
                date={b.submitted_at as string}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Deals */}
      <TabsContent value="deals">
        {deals.length === 0 ? (
          <EmptyState title={t('noDeals')} icon={<Handshake className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {deals.map((d) => (
              <EntityRow
                key={d.id as string}
                href={`/admin/deals/${d.id as string}`}
                title={`${(d.title_slug as string)} — ${Number(d.value).toLocaleString(locale)} ${t('currency')}`}
                status={d.status as string}
                date={d.created_at as string}
                extra={d.deal_type as string}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Quotations */}
      <TabsContent value="quotations">
        {quotations.length === 0 ? (
          <EmptyState title={t('noQuotations')} icon={<Receipt className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {quotations.map((q) => (
              <EntityRow
                key={q.id as string}
                href={`/admin/deals`}
                title={`${q.number as string} — ${Number(q.total).toLocaleString(locale)} ${t('currency')}`}
                status={q.status as string}
                date={q.created_at as string}
                extra={q.mode as string}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Reviews Given */}
      <TabsContent value="reviewsGiven">
        {reviewsGiven.length === 0 ? (
          <EmptyState title={t('noReviews')} icon={<Star className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {reviewsGiven.map((r) => (
              <div key={r.id as string} className="rounded-md border border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">{r.overall_rating as number}/5</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at as string).toLocaleDateString(locale)}
                  </span>
                </div>
                {!!(r.comment_ar || r.comment_en) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {locale === 'ar' ? (r.comment_ar as string) ?? (r.comment_en as string) : (r.comment_en as string) ?? (r.comment_ar as string)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Reviews Received */}
      <TabsContent value="reviewsReceived">
        {reviewsReceived.length === 0 ? (
          <EmptyState title={t('noReviews')} icon={<Star className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {reviewsReceived.map((r) => (
              <div key={r.id as string} className="rounded-md border border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">{r.overall_rating as number}/5</span>
                    {!!r.is_hidden && <Badge variant="warning" className="text-[10px]">{t('hidden')}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at as string).toLocaleDateString(locale)}
                  </span>
                </div>
                {!!(r.comment_ar || r.comment_en) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {locale === 'ar' ? (r.comment_ar as string) ?? (r.comment_en as string) : (r.comment_en as string) ?? (r.comment_ar as string)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Commissions */}
      <TabsContent value="commissions">
        {commissions.length === 0 ? (
          <EmptyState title={t('noCommissions')} icon={<DollarSign className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {commissions.map((c) => (
              <EntityRow
                key={c.id as string}
                href={`/admin/commissions`}
                title={`${Number(c.amount).toLocaleString(locale)} ${t('currency')}`}
                status={c.status as string}
                date={c.created_at as string}
                extra={`${t('vat')}: ${Number(c.vat_amount).toLocaleString(locale)} ${t('currency')}`}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Audit Log */}
      <TabsContent value="auditLog">
        {auditEntries.length === 0 ? (
          <EmptyState title={t('noAuditEntries')} icon={<ScrollText className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {auditEntries.map((a) => (
              <div key={a.id as string} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="info" className="text-[10px]">{a.action as string}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {JSON.stringify(a.details).slice(0, 80)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(a.created_at as string).toLocaleDateString(locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Notifications */}
      <TabsContent value="notifications">
        {notifications.length === 0 ? (
          <EmptyState title={t('noNotifications')} icon={<Bell className="h-10 w-10" />} />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id as string} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{n.type as string}</Badge>
                    {n.is_read ? (
                      <Badge variant="success" className="text-[10px]">{t('read')}</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">{t('unread')}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs">
                    {locale === 'ar' ? (n.title_ar as string) : (n.title_en as string)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(n.created_at as string).toLocaleDateString(locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
