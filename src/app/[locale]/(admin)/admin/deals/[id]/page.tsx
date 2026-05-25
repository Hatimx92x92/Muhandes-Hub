import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Banknote,
  Calendar,
  FileText,
  Activity,
  CheckCircle,
  Clock,
  ShieldAlert,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { getProxyUrl } from '@/lib/file-utils';
import { FileActions } from '@/components/features/file-actions';
import { verifyAdmin } from '@/actions/admin/queries';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminDealDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  // Use admin pattern — verifyAdmin returns admin client
  const adminClient = await verifyAdmin();

  // Fetch deal with buyer/seller profiles
  const { data: deal } = await db(adminClient)
    .from('deals')
    .select(`
      id, deal_type, status, value, trigger_source, commission_rate, commission_amount, commission_vat,
      seller_progress, buyer_progress, started_at, completed_at, cancelled_at, disputed_at,
      created_at, updated_at, bid_id, quotation_id, rfq_response_id, hire_request_id, project_id, product_id,
      buyer_id, seller_id,
      buyer:profiles!deals_buyer_id_fkey(id, full_name, company_name_ar, company_name_en, email, role),
      seller:profiles!deals_seller_id_fkey(id, full_name, company_name_ar, company_name_en, email, role)
    `)
    .eq('id', id)
    .single();

  if (!deal) redirect('/admin/deals');

  // Fetch all related data in parallel
  const [
    { data: commissions },
    { data: milestones },
    { data: proofs },
    { data: documents },
    { data: siteLogs },
    { data: activityLog },
    { data: skipRequests },
    { data: cancelRequests },
  ] = await Promise.all([
    db(adminClient)
      .from('commissions')
      .select('id, amount, vat_amount, total, status, due_date, payment_method, dispute_reason, created_at')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    db(adminClient)
      .from('deal_milestones')
      .select('id, title_ar, title_en, description_ar, description_en, payment_amount, status, due_date, progress, sort_order, created_at')
      .eq('deal_id', id)
      .order('sort_order', { ascending: true }),
    db(adminClient)
      .from('deal_proofs')
      .select('id, proof_type, description, percentage_claim, file_urls, status, rejection_reason, rejection_text, created_at, submitter_id')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    db(adminClient)
      .from('deal_documents')
      .select('id, category, file_url, file_name, file_size, mime_type, notes, version, created_at')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    db(adminClient)
      .from('daily_site_logs')
      .select('id, log_date, weather, workers_on_site, description_ar, description_en, issues, safety_notes, photo_urls, created_at')
      .eq('deal_id', id)
      .order('log_date', { ascending: false })
      .limit(20),
    db(adminClient)
      .from('deal_activity_log')
      .select('id, action, details, created_at, actor_id')
      .eq('deal_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    db(adminClient)
      .from('deal_skip_requests')
      .select('id, reason, status, created_at, requester_id')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    db(adminClient)
      .from('deal_cancel_requests')
      .select('id, reason, status, created_at, requester_id')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const buyer = deal.buyer as Record<string, string> | null;
  const seller = deal.seller as Record<string, string> | null;
  const getName = (p: Record<string, string> | null) => p?.full_name ?? t('noName');
  const getCompany = (p: Record<string, string> | null) => {
    if (!p) return '';
    return locale === 'ar'
      ? (p.company_name_ar ?? p.company_name_en ?? '')
      : (p.company_name_en ?? p.company_name_ar ?? '');
  };

  const triggerLabel: Record<string, string> = {
    bid_award: t('dealsPage.triggerBidAward'),
    inquiry_quotation: t('dealsPage.triggerQuotation'),
    rfq_response: t('dealsPage.triggerRfqResponse'),
    direct_hire: t('dealsPage.triggerDirectHire'),
  };

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={id} label={`${t('dealsPage.dealPrefix')} #${id.slice(0, 8)}`} />

      {/* Deal Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{t('dealsPage.dealPrefix')} #{id.slice(0, 8)}</CardTitle>
            <div className="flex gap-2">
              <Badge variant={deal.status as 'active' | 'completed' | 'cancelled'}>
                {t(`dealStatus.${deal.status}`)}
              </Badge>
              <Badge variant="secondary">{t(`dealType.${deal.deal_type}`)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('dealsPage.valueLabel')}</p>
                <p className="font-bold">{formatSAR(Number(deal.value ?? 0), locale)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                <Calendar className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('userDetail.createdAt')}</p>
                <p className="text-sm font-medium">{new Date(deal.created_at).toLocaleDateString(locale)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('dealsPage.triggerSource')}</p>
                <p className="text-sm font-medium">{triggerLabel[deal.trigger_source] ?? deal.trigger_source ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t('dealsPage.sellerProgress')}</span>
                <span className="text-xs font-medium">{deal.seller_progress ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${deal.seller_progress ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t('dealsPage.buyerProgress')}</span>
                <span className="text-xs font-medium">{deal.buyer_progress ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${deal.buyer_progress ?? 0}%` }} />
              </div>
            </div>
          </div>

          {/* Key Timestamps */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            {deal.started_at && <span>{t('dealsPage.startedAt')}: {new Date(deal.started_at).toLocaleDateString(locale)}</span>}
            {deal.completed_at && <span>{t('dealsPage.completedAt')}: {new Date(deal.completed_at).toLocaleDateString(locale)}</span>}
            {deal.cancelled_at && <span className="text-destructive">{t('dealsPage.cancelledAt')}: {new Date(deal.cancelled_at).toLocaleDateString(locale)}</span>}
            {deal.disputed_at && <span className="text-destructive">{t('dealsPage.disputedAt')}: {new Date(deal.disputed_at).toLocaleDateString(locale)}</span>}
          </div>

          {/* Source links */}
          <div className="flex flex-wrap gap-2 text-xs">
            {deal.project_id && (
              <Link href={`/admin/posts/project-${deal.project_id}`} className="text-primary hover:underline">
                {t('dealsPage.linkedProject')} →
              </Link>
            )}
            {deal.product_id && (
              <Link href={`/admin/posts/product-${deal.product_id}`} className="text-primary hover:underline">
                {t('dealsPage.linkedProduct')} →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              {t('dealsPage.buyer')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/admin/users/${deal.buyer_id}`} className="text-primary hover:underline font-medium">
              {getName(buyer)}
            </Link>
            <p className="text-sm text-muted-foreground">{getCompany(buyer)}</p>
            <p className="text-xs text-muted-foreground">{buyer?.email}</p>
            {buyer?.role ? <Badge variant="secondary" className="mt-1">{buyer.role}</Badge> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              {t('dealsPage.seller')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/admin/users/${deal.seller_id}`} className="text-primary hover:underline font-medium">
              {getName(seller)}
            </Link>
            <p className="text-sm text-muted-foreground">{getCompany(seller)}</p>
            <p className="text-xs text-muted-foreground">{seller?.email}</p>
            {seller?.role ? <Badge variant="secondary" className="mt-1">{seller.role}</Badge> : null}
          </CardContent>
        </Card>
      </div>

      {/* Commission Summary on deal */}
      {deal.commission_rate != null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              {t('dealsPage.commissionSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('dealsPage.commissionRate')}</p>
                <p className="font-medium">{deal.commission_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('dealsPage.commissionAmount')}</p>
                <p className="font-medium">{formatSAR(Number(deal.commission_amount ?? 0), locale)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('commissionsPage.vat')}</p>
                <p className="font-medium">{formatSAR(Number(deal.commission_vat ?? 0), locale)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('dealsPage.commissionTotal')}</p>
                <p className="font-bold">{formatSAR(Number(deal.commission_amount ?? 0) + Number(deal.commission_vat ?? 0), locale)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commissions */}
      {commissions && commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" />
              {t('nav.commissions')}
              <Badge variant="secondary">{commissions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(commissions as Record<string, unknown>[]).map((c) => (
                <div key={c.id as string} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatSAR(Number(c.amount ?? 0), locale)}
                      <span className="text-xs text-muted-foreground ms-2">
                        + {t('commissionsPage.vat')} {formatSAR(Number(c.vat_amount ?? 0), locale)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.due_date ? new Date(c.due_date as string).toLocaleDateString(locale) : '—'}
                      {c.payment_method ? <span className="ms-2">({c.payment_method as string})</span> : null}
                    </p>
                    {c.dispute_reason ? (
                      <p className="text-xs text-destructive mt-1">{c.dispute_reason as string}</p>
                    ) : null}
                  </div>
                  <Badge variant={c.status === 'paid' ? 'success' : c.status === 'disputed' ? 'destructive' : 'pending'}>
                    {t(`commissionStatus.${c.status as string}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              {t('dealsPage.milestones')}
              <Badge variant="secondary">{milestones.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(milestones as Record<string, unknown>[]).map((m) => (
                <div key={m.id as string} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {locale === 'ar'
                          ? ((m.title_ar as string) || (m.title_en as string))
                          : ((m.title_en as string) || (m.title_ar as string))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSAR(Number(m.payment_amount ?? 0), locale)}
                        {m.due_date ? <span className="ms-2">• {new Date(m.due_date as string).toLocaleDateString(locale)}</span> : null}
                      </p>
                      {((m.description_ar as string) || (m.description_en as string)) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === 'ar'
                            ? ((m.description_ar as string) || (m.description_en as string))
                            : ((m.description_en as string) || (m.description_ar as string))}
                        </p>
                      )}
                    </div>
                    <Badge variant={m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'info' : 'pending'}>
                      {String(m.status)}
                    </Badge>
                  </div>
                  {/* Milestone progress bar */}
                  {(m.progress as number) > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${m.progress as number}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deal Proofs */}
      {proofs && proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4" />
              {t('dealsPage.proofs')}
              <Badge variant="secondary">{proofs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(proofs as Record<string, unknown>[]).map((p) => (
                <div key={p.id as string} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{p.proof_type as string}</Badge>
                      {(p.percentage_claim as number) > 0 && (
                        <span className="text-xs text-muted-foreground">{p.percentage_claim as number}%</span>
                      )}
                    </div>
                    <Badge
                      variant={
                        p.status === 'confirmed' ? 'success'
                        : p.status === 'rejected' ? 'destructive'
                        : p.status === 'disputed' ? 'warning'
                        : 'pending'
                      }
                    >
                      {p.status as string}
                    </Badge>
                  </div>
                  {p.description ? <p className="text-sm text-foreground">{p.description as string}</p> : null}
                  {p.rejection_reason ? (
                    <p className="text-xs text-destructive">{t('dealsPage.rejectionReason')}: {p.rejection_reason as string}</p>
                  ) : null}
                  {p.rejection_text ? (
                    <p className="text-xs text-destructive">{p.rejection_text as string}</p>
                  ) : null}
                  {/* File links */}
                  {Array.isArray(p.file_urls) && (p.file_urls as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(p.file_urls as string[]).map((url, i) => (
                        <a
                          key={i}
                          href={getProxyUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          {t('dealsPage.file')} {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at as string).toLocaleDateString(locale)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              {t('dealsPage.documents')}
              <Badge variant="secondary">{documents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(documents as Record<string, unknown>[]).map((doc) => (
                <div key={doc.id as string} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.file_name as string}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{doc.category as string}</Badge>
                      <span>{((doc.file_size as number) / 1024).toFixed(0)} KB</span>
                      {(doc.version as number) > 1 && <span>v{doc.version as number}</span>}
                    </div>
                    {doc.notes ? <p className="text-xs text-muted-foreground mt-0.5">{doc.notes as string}</p> : null}
                  </div>
                  <FileActions url={doc.file_url as string} fileName={doc.file_name as string} compact />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Site Logs */}
      {siteLogs && siteLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {t('dealsPage.siteLogs')}
              <Badge variant="secondary">{siteLogs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(siteLogs as Record<string, unknown>[]).map((log) => (
                <div key={log.id as string} className="rounded-lg border border-border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{new Date(log.log_date as string).toLocaleDateString(locale)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {log.weather ? <span>🌤 {log.weather as string}</span> : null}
                      {log.workers_on_site != null ? <span>👷 {log.workers_on_site as number}</span> : null}
                    </div>
                  </div>
                  {((log.description_ar as string) || (log.description_en as string)) && (
                    <p className="text-sm text-foreground">
                      {locale === 'ar'
                        ? ((log.description_ar as string) || (log.description_en as string))
                        : ((log.description_en as string) || (log.description_ar as string))}
                    </p>
                  )}
                  {log.issues ? <p className="text-xs text-destructive">⚠ {log.issues as string}</p> : null}
                  {log.safety_notes ? <p className="text-xs text-warning-foreground">{log.safety_notes as string}</p> : null}
                  {Array.isArray(log.photo_urls) && (log.photo_urls as string[]).length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {(log.photo_urls as string[]).slice(0, 4).map((url, i) => (
                        <a key={i} href={getProxyUrl(url)} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getProxyUrl(url)} alt="" className="h-12 w-12 rounded object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip & Cancel Requests */}
      {((skipRequests && skipRequests.length > 0) || (cancelRequests && cancelRequests.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4" />
              {t('dealsPage.requests')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(skipRequests as Record<string, unknown>[] | null)?.map((r) => (
              <div key={r.id as string} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{t('dealsPage.skipRequest')}</p>
                  {r.reason ? <p className="text-xs text-muted-foreground">{r.reason as string}</p> : null}
                  <p className="text-[10px] text-muted-foreground">{new Date(r.created_at as string).toLocaleDateString(locale)}</p>
                </div>
                <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'pending'}>
                  {r.status as string}
                </Badge>
              </div>
            ))}
            {(cancelRequests as Record<string, unknown>[] | null)?.map((r) => (
              <div key={r.id as string} className="flex items-center justify-between rounded-lg border border-destructive/30 p-3">
                <div>
                  <p className="text-sm font-medium text-destructive">{t('dealsPage.cancelRequest')}</p>
                  {r.reason ? <p className="text-xs text-muted-foreground">{r.reason as string}</p> : null}
                  <p className="text-[10px] text-muted-foreground">{new Date(r.created_at as string).toLocaleDateString(locale)}</p>
                </div>
                <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'pending'}>
                  {r.status as string}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      {activityLog && activityLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              {t('dealsPage.activityLog')}
              <Badge variant="secondary">{activityLog.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {(activityLog as Record<string, unknown>[]).map((entry) => (
                <div key={entry.id as string} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{entry.action as string}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(entry.created_at as string).toLocaleString(locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
