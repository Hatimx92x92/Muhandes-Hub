// =============================================================================
// Deal Document Vault Page — Server Component
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { DocumentVault } from '@/components/features/deals/document-vault';
import { isUUID } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');

  // Resolve deal by UUID or title_slug
  let deal;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('deals').select('id, buyer_id, seller_id, title_slug').eq('id', slug).single();
    deal = data;
  } else {
    const { data } = await db(supabase).from('deals').select('id, buyer_id, seller_id, title_slug').eq('title_slug', slug).single();
    deal = data;
  }

  if (!deal) notFound();

  // Must be a deal participant
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    redirect('/dashboard/deals');
  }

  const displaySlug = deal.title_slug || slug;

  // Fetch documents
  const { data: documents } = await db(supabase)
    .from('deal_documents')
    .select('id, category, file_url, file_name, file_size, mime_type, notes, created_at, uploader:profiles!deal_documents_uploader_id_fkey(full_name)')
    .eq('deal_id', deal.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={displaySlug} label={`#${(deal.id as string).slice(0, 8)}`} />

      <div>
        <h1 className="text-xl font-bold">{t('documentVault')}</h1>
        <p className="text-sm text-muted-foreground">{t('documentVaultDesc')}</p>
      </div>

      <DocumentVault dealId={deal.id} documents={documents || []} />
    </div>
  );
}
