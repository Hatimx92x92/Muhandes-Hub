// =============================================================================
// Deal Photo Timeline Page — Server Component
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { PhotoTimeline, type TimelinePhoto } from '@/components/features/deals/photo-timeline';
import { isUUID } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function PhotosPage({
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

  const dealId = deal.id as string;
  const displaySlug = deal.title_slug || slug;

  // Fetch photos from daily_site_logs and deal_proofs in parallel
  const [{ data: logs }, { data: proofs }] = await Promise.all([
    db(supabase)
      .from('daily_site_logs')
      .select('log_date, photo_urls')
      .eq('deal_id', dealId)
      .not('photo_urls', 'is', null)
      .order('log_date', { ascending: false }),
    db(supabase)
      .from('deal_proofs')
      .select('created_at, file_urls')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false }),
  ]);

  // Aggregate photos into a unified timeline
  const photos: TimelinePhoto[] = [];

  // Photos from daily logs
  if (logs) {
    for (const log of logs) {
      const urls = log.photo_urls as string[] | null;
      if (urls && Array.isArray(urls)) {
        for (const url of urls) {
          if (typeof url === 'string' && url.startsWith('http')) {
            photos.push({
              url,
              date: log.log_date as string,
              source: 'daily_log',
            });
          }
        }
      }
    }
  }

  // Photos from deal proofs (filter for image URLs)
  if (proofs) {
    for (const proof of proofs) {
      const urls = proof.file_urls as string[] | null;
      if (urls && Array.isArray(urls)) {
        for (const url of urls) {
          if (typeof url === 'string' && url.startsWith('http') && /\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
            photos.push({
              url,
              date: proof.created_at as string,
              source: 'proof',
            });
          }
        }
      }
    }
  }

  // Sort all photos by date descending
  photos.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={displaySlug} label={`#${dealId.slice(0, 8)}`} />

      <div>
        <h1 className="text-xl font-bold">{t('photoTimeline')}</h1>
        <p className="text-sm text-muted-foreground">{t('photoTimelineDesc')}</p>
      </div>

      <PhotoTimeline photos={photos} />
    </div>
  );
}
