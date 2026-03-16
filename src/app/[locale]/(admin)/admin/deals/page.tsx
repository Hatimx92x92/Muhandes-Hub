import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const statusFilter = params.status ?? 'all';

  let query = db(supabase)
    .from('deals')
    .select('id, deal_type, status, total_value, created_at, buyer_id, seller_id')
    .order('created_at', { ascending: false })
    .limit(50);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: deals } = await query;

  const statuses = ['all', 'active', 'in_progress', 'completed', 'cancelled', 'disputed'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dealsPage.title')}</h1>
        <p className="text-muted-foreground">{t('dealsPage.subtitle')}</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <a
            key={s}
            href={`/admin/deals?status=${s}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? t('all') : t(`dealStatus.${s}`)}
          </a>
        ))}
      </div>

      {/* Deals list */}
      {!deals || deals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('dealsPage.noDeals')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(deals as Record<string, unknown>[]).map((deal) => (
            <Card key={deal.id as string}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {t('dealsPage.dealPrefix')} #{(deal.id as string).slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t(`dealType.${deal.deal_type as string}`)}
                    </p>
                  </div>
                  <Badge variant={deal.status as 'active' | 'completed' | 'cancelled'}>
                    {t(`dealStatus.${deal.status as string}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">{t('dealsPage.valueLabel')} </span>
                      <span className="font-semibold">
                        {Number(deal.total_value ?? 0).toLocaleString(locale)} {t('sar')}
                      </span>
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {new Date(deal.created_at as string).toLocaleDateString(locale)}
                    </time>
                  </div>
                  <Link
                    href={`/dashboard/deals/${deal.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('viewDetails')}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
