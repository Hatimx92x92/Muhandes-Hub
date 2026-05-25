import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/features/empty-state';
import { ContactSubmissionActions } from '@/components/features/admin/contact-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.contactsPage');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: submissions } = await db(supabase)
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const items = (submissions ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-12 w-12" />}
          title={t('noContacts')}
          description={t('noContactsDesc')}
        />
      ) : (
        <div className="space-y-3">
          {items.map((sub) => (
            <Card key={sub.id as string} className={sub.is_read ? 'opacity-75' : ''}>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{sub.name as string}</p>
                      <Badge variant={sub.is_read ? 'secondary' : 'info'}>
                        {sub.is_read ? t('read') : t('unread')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.email as string}</p>
                    {!!sub.company && (
                      <p className="text-xs text-muted-foreground">{t('company')} {sub.company as string}</p>
                    )}
                    {!!sub.role_interest && (
                      <p className="text-xs text-muted-foreground">{t('roleInterest')} {sub.role_interest as string}</p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {t('receivedAt')} {new Date(sub.created_at as string).toLocaleDateString(locale)}
                  </time>
                </div>

                {!!sub.subject && (
                  <p className="text-sm font-medium text-foreground">{t('subject')} {sub.subject as string}</p>
                )}

                <p className="text-sm">{sub.message as string}</p>

                <ContactSubmissionActions
                  submissionId={sub.id as string}
                  isRead={!!sub.is_read}
                  email={sub.email as string}
                  name={sub.name as string}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
