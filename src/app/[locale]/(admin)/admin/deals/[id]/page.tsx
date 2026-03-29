import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, Banknote, Calendar, FileText } from 'lucide-react';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch deal with buyer/seller profiles
  const { data: deal } = await db(supabase)
    .from('deals')
    .select(`
      id, deal_type, status, total_value, created_at, updated_at,
      buyer_id, seller_id,
      buyer:profiles!deals_buyer_id_fkey(full_name_ar, full_name_en, company_name_ar, company_name_en, email),
      seller:profiles!deals_seller_id_fkey(full_name_ar, full_name_en, company_name_ar, company_name_en, email)
    `)
    .eq('id', id)
    .single();

  if (!deal) redirect('/admin/deals');

  // Fetch related commissions
  const { data: commissions } = await db(supabase)
    .from('commissions')
    .select('id, amount, vat_amount, total, status, due_date, created_at')
    .eq('deal_id', id)
    .order('created_at', { ascending: false });

  // Fetch milestones
  const { data: milestones } = await db(supabase)
    .from('milestones')
    .select('id, title_ar, title_en, amount, status, due_date, created_at')
    .eq('deal_id', id)
    .order('created_at', { ascending: true });

  const getName = (p: Record<string, string> | null) => {
    if (!p) return t('noName');
    return locale === 'ar'
      ? (p.full_name_ar ?? p.full_name_en ?? t('noName'))
      : (p.full_name_en ?? p.full_name_ar ?? t('noName'));
  };

  const getCompany = (p: Record<string, string> | null) => {
    if (!p) return '';
    return locale === 'ar'
      ? (p.company_name_ar ?? p.company_name_en ?? '')
      : (p.company_name_en ?? p.company_name_ar ?? '');
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
                <p className="font-bold">{Number(deal.total_value ?? 0).toLocaleString(locale)} {t('sar')}</p>
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
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="font-mono text-xs">{id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Buyer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/admin/users/${deal.buyer_id}`} className="text-primary hover:underline font-medium">
              {getName(deal.buyer as Record<string, string>)}
            </Link>
            <p className="text-sm text-muted-foreground">{getCompany(deal.buyer as Record<string, string>)}</p>
            <p className="text-xs text-muted-foreground">{(deal.buyer as Record<string, string>)?.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Seller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/admin/users/${deal.seller_id}`} className="text-primary hover:underline font-medium">
              {getName(deal.seller as Record<string, string>)}
            </Link>
            <p className="text-sm text-muted-foreground">{getCompany(deal.seller as Record<string, string>)}</p>
            <p className="text-xs text-muted-foreground">{(deal.seller as Record<string, string>)?.email}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commissions */}
      {commissions && commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" />
              {t('nav.commissions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(commissions as Record<string, unknown>[]).map((c) => (
                <div key={c.id as string} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {Number(c.amount ?? 0).toLocaleString(locale)} {t('sar')}
                      <span className="text-xs text-muted-foreground ms-2">
                        + {t('commissionsPage.vat')} {Number(c.vat_amount ?? 0).toLocaleString(locale)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.due_date ? new Date(c.due_date as string).toLocaleDateString(locale) : '—'}
                    </p>
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
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(milestones as Record<string, unknown>[]).map((m) => (
                <div key={m.id as string} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {locale === 'ar' ? (m.title_ar as string) : (m.title_en as string) ?? (m.title_ar as string)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(m.amount ?? 0).toLocaleString(locale)} {t('sar')}
                    </p>
                  </div>
                  <Badge variant={m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'info' : 'pending'}>
                    {String(m.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
