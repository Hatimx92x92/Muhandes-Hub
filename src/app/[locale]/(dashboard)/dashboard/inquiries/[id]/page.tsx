// =============================================================================
// Inquiry Detail Page — Dashboard (for suppliers to view & respond)
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, User, Calendar, Hash, FileText, Send } from 'lucide-react';
import { formatDate, getLocaleField } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  pending: 'pending',
  responded: 'published',
  closed: 'secondary',
};

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.inquiryDetail');
  const locale = await getLocale();

  // Fetch inquiry
  const { data: inquiry } = await db(supabase)
    .from('inquiries')
    .select('id, product_id, sender_id, quantity, timeline, requirements_ar, requirements_en, status, created_at')
    .eq('id', id)
    .single();

  if (!inquiry) redirect('/dashboard/inquiries');

  // Fetch product
  const { data: product } = await db(supabase)
    .from('products')
    .select('name_ar, name_en, supplier_id')
    .eq('id', inquiry.product_id)
    .single();

  // Only product supplier can view
  if (!product || product.supplier_id !== user.id) redirect('/dashboard/inquiries');

  // Fetch sender profile
  const { data: senderProfile } = await db(supabase)
    .from('profiles')
    .select('full_name_ar, full_name_en, company_name_ar, company_name_en')
    .eq('id', inquiry.sender_id)
    .single();

  const isSupplier = product.supplier_id === user.id;

  // Fetch linked quotations for this inquiry
  const { data: quotations } = await db(supabase)
    .from('quotations')
    .select('id, number, total, status, created_at')
    .eq('inquiry_id', id)
    .order('created_at', { ascending: false });

  const senderName = senderProfile
    ? (getLocaleField(senderProfile, 'company_name', locale) || getLocaleField(senderProfile, 'full_name', locale))
    : t('unknownSender');

  const productName = product ? getLocaleField(product, 'name', locale) : t('unknownProduct');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {isSupplier && inquiry.status !== 'closed' && (
          <Link
            href={`/dashboard/quotations/new?inquiry_id=${inquiry.id}&recipient_id=${inquiry.sender_id}&mode=inquiry_response`}
          >
            <Button>
              <Send className="h-4 w-4 me-2" />
              {t('respondWithQuotation')}
            </Button>
          </Link>
        )}
      </div>

      {/* Inquiry Details */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusBadge[inquiry.status] ?? 'secondary'}>
            {t(`status.${inquiry.status}`)}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('product')}:</span>
            <span className="font-medium">{productName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('from')}:</span>
            <span className="font-medium">{senderName}</span>
          </div>

          {inquiry.quantity && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('quantity')}:</span>
              <span className="font-medium">{inquiry.quantity}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t('date')}:</span>
            <span>{formatDate(inquiry.created_at, locale)}</span>
          </div>
        </div>

        {(inquiry.requirements_ar || inquiry.requirements_en) && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t('requirements')}</p>
            {inquiry.requirements_ar && (
              <p className="text-sm" dir="rtl">{inquiry.requirements_ar}</p>
            )}
            {inquiry.requirements_en && (
              <p className="text-sm">{inquiry.requirements_en}</p>
            )}
          </div>
        )}
      </Card>

      {/* Linked Quotations */}
      {quotations && quotations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('linkedQuotations')}</h2>
          {quotations.map((q: { id: string; number: string; total: number; status: string; created_at: string }) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{q.number}</p>
                    <p className="text-sm text-muted-foreground">
                      SAR {q.total?.toLocaleString()} · {formatDate(q.created_at, locale)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadge[q.status] ?? 'secondary'}>
                    {q.status}
                  </Badge>
                  <Link href={`/dashboard/quotations/${q.id}`} className="text-sm text-primary hover:underline">
                    {t('viewQuotation')}
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
