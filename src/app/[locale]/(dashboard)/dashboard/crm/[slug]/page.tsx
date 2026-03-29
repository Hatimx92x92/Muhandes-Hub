// =============================================================================
// CRM Client Detail Page — Server Component
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ClientActions } from '@/components/features/crm/client-actions';
import { ClientNoteForm } from '@/components/features/crm/client-note-form';
import { ClientReminderForm } from '@/components/features/crm/client-reminder-form';
import { isUUID } from '@/lib/utils';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function CRMClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations('dashboard.crm');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Slug-based client lookup
  let client;
  if (isUUID(slug)) {
    const { data } = await db(supabase)
      .from('crm_clients')
      .select('slug')
      .eq('id', slug)
      .eq('owner_id', user.id)
      .single();
    if (data?.slug) redirect(`/dashboard/crm/${data.slug}`);
    // Fall through to fetch by ID if no slug set
    const { data: clientData } = await db(supabase)
      .from('crm_clients')
      .select('*, crm_client_tags(tag_id, crm_tags(id, name, color))')
      .eq('id', slug)
      .eq('owner_id', user.id)
      .single();
    client = clientData;
  } else {
    const { data } = await db(supabase)
      .from('crm_clients')
      .select('*, crm_client_tags(tag_id, crm_tags(id, name, color))')
      .eq('slug', slug)
      .eq('owner_id', user.id)
      .single();
    client = data;
  }

  if (!client) notFound();
  const id = client.id;
  const displaySlug = client.slug || slug;

  // Fetch notes
  const { data: notes } = await db(supabase)
    .from('crm_client_notes')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  // Fetch reminders
  const { data: reminders } = await db(supabase)
    .from('crm_follow_up_reminders')
    .select('*')
    .eq('client_id', id)
    .order('reminder_date', { ascending: true });

  // Fetch all user tags for tag management
  const { data: allTags } = await db(supabase)
    .from('crm_tags')
    .select('*')
    .eq('owner_id', user.id)
    .order('name');

  // Fetch linked deals
  const linkedProfileId = client.linked_profile_id as string | null;
  let deals: Record<string, unknown>[] = [];
  if (linkedProfileId) {
    const { data } = await db(supabase)
      .from('deals')
      .select('id, deal_type, status, total_amount, created_at')
      .or(`buyer_id.eq.${linkedProfileId},seller_id.eq.${linkedProfileId}`)
      .order('created_at', { ascending: false })
      .limit(5);
    deals = data || [];
  }

  const clientTags = ((client.crm_client_tags as Array<Record<string, unknown>>) || [])
    .map((ct: Record<string, unknown>) => ct.crm_tags as Record<string, unknown>)
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={displaySlug} label={client.name as string} />
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {!!client.is_favorite && <span className="text-xl text-warning">★</span>}
            <h1 className="text-2xl font-bold">{client.name as string}</h1>
            <Badge variant={client.is_archived ? 'secondary' : 'default'}>
              {client.is_archived ? t('archived') : t(`stage.${client.pipeline_stage as string}`)}
            </Badge>
          </div>
          {!!client.company && (
            <p className="text-sm text-muted-foreground">{client.company as string}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card className="p-6 space-y-3">
            <h2 className="font-bold">{t('clientData')}</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {!!client.phone && (
                <div>
                  <span className="text-muted-foreground">{t('phone')}:</span>{' '}
                  <span dir="ltr">{client.phone as string}</span>
                </div>
              )}
              {!!client.email && (
                <div>
                  <span className="text-muted-foreground">{t('email')}:</span>{' '}
                  <span dir="ltr">{client.email as string}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">{t('sourceLabel')}:</span>{' '}
                {t(`sourceType.${client.source as string}`)}
              </div>
              <div>
                <span className="text-muted-foreground">{t('dateAdded')}:</span>{' '}
                {new Date(client.created_at as string).toLocaleDateString(locale)}
              </div>
              {!!client.last_interaction_at && (
                <div>
                  <span className="text-muted-foreground">{t('lastInteraction')}:</span>{' '}
                  {new Date(client.last_interaction_at as string).toLocaleDateString(locale)}
                </div>
              )}
            </div>
            {/* Tags */}
            {clientTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {clientTags.map((tag: Record<string, unknown>) => (
                  <span
                    key={tag.id as string}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${tag.color as string}20`, color: tag.color as string }}
                  >
                    {tag.name as string}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold">{t('notes')} ({(notes || []).length})</h2>
            <ClientNoteForm clientId={id} />
            {(notes && notes.length > 0) ? (
              <div className="space-y-3">
                {notes.map((note: Record<string, unknown>) => (
                  <div
                    key={note.id as string}
                    className={`rounded-lg border p-3 ${note.is_pinned ? 'border-warning/30 bg-warning/10' : 'border-border'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {!!note.is_pinned && <span className="text-warning text-xs">📌</span>}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(note.created_at as string).toLocaleString(locale)}
                        </span>
                      </div>
                    </div>
                    {!!note.content_ar && <p className="text-sm whitespace-pre-wrap">{note.content_ar as string}</p>}
                    {!!note.content_en && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{note.content_en as string}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noNotesYet')}</p>
            )}
          </Card>

          {/* Linked Deals */}
          {deals.length > 0 && (
            <Card className="p-6 space-y-3">
              <h2 className="font-bold">{t('linkedDeals')} ({deals.length})</h2>
              <div className="space-y-2">
                {deals.map((deal: Record<string, unknown>) => (
                  <Link
                    key={deal.id as string}
                    href={`/dashboard/deals/${(deal as Record<string, unknown>).title_slug || deal.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-primary transition-colors"
                  >
                    <div>
                      <span className="font-medium">{deal.deal_type as string}</span>
                      <Badge variant={deal.status === 'completed' ? 'completed' : 'active'} className="ms-2">
                        {deal.status as string}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {deal.total_amount ? `${Number(deal.total_amount).toLocaleString(locale)} ${tCommon('sar')}` : '—'}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <ClientActions
            clientId={id}
            isFavorite={!!client.is_favorite}
            isArchived={!!client.is_archived}
            currentStage={client.pipeline_stage as string}
            allTags={allTags || []}
            currentTagIds={clientTags.map((tagItem: Record<string, unknown>) => tagItem.id as string)}
            clientName={client.name as string}
            clientEmail={(client.email as string) || null}
            clientPhone={(client.phone as string) || null}
            clientCompany={(client.company as string) || null}
          />

          {/* Reminders */}
          <Card className="p-4 space-y-3">
            <h3 className="font-bold text-sm">{t('reminders')}</h3>
            <ClientReminderForm clientId={id} />
            {(reminders && reminders.length > 0) ? (
              <div className="space-y-2">
                {reminders.map((r: Record<string, unknown>) => (
                  <div
                    key={r.id as string}
                    className={`rounded-lg border p-2 text-xs ${r.is_completed ? 'border-border opacity-50 line-through' : 'border-warning/30'}`}
                  >
                    <p className="font-medium">{new Date(r.reminder_date as string).toLocaleDateString(locale)}</p>
                    {!!r.note && <p className="text-muted-foreground">{r.note as string}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('noReminders')}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
