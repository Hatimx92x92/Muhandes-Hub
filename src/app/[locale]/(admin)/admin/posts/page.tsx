import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { AdminPostActions } from '@/components/features/admin/post-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const statusFilter = params.status ?? 'pending';
  const typeFilter = params.type ?? 'all';

  // Fetch posts from all 3 tables in parallel
  const buildQuery = (table: string) => {
    let query = db(supabase)
      .from(table)
      .select('id, title_ar, title_en, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50);
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    return query;
  };

  const [
    { data: projects },
    { data: products },
    { data: rfqs },
  ] = await Promise.all([
    typeFilter === 'all' || typeFilter === 'project' ? buildQuery('projects') : Promise.resolve({ data: [] }),
    typeFilter === 'all' || typeFilter === 'product' ? buildQuery('products') : Promise.resolve({ data: [] }),
    typeFilter === 'all' || typeFilter === 'rfq' ? buildQuery('rfqs') : Promise.resolve({ data: [] }),
  ]);

  // Merge and tag with type
  type PostItem = { id: string; title_ar: string; title_en: string; status: string; created_at: string; user_id: string; type: string };
  const allPosts: PostItem[] = [
    ...(projects ?? []).map((p: Record<string, unknown>) => ({ ...p, type: 'project' } as PostItem)),
    ...(products ?? []).map((p: Record<string, unknown>) => ({ ...p, type: 'product' } as PostItem)),
    ...(rfqs ?? []).map((p: Record<string, unknown>) => ({ ...p, type: 'rfq' } as PostItem)),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const statuses = ['pending', 'published', 'rejected', 'all'];
  const types = ['all', 'project', 'product', 'rfq'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('postsPage.title')}</h1>
        <p className="text-muted-foreground">{t('postsPage.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">{t('postsPage.statusLabel')}</span>
          {statuses.map((s) => (
            <a
              key={s}
              href={`/admin/posts?status=${s}&type=${typeFilter}`}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s === 'all' ? t('all') : t(`postStatus.${s}`)}
            </a>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">{t('postsPage.typeLabel')}</span>
          {types.map((tp) => (
            <a
              key={tp}
              href={`/admin/posts?status=${statusFilter}&type=${tp}`}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === tp
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tp === 'all' ? t('all') : t(`postType.${tp}`)}
            </a>
          ))}
        </div>
      </div>

      {/* Posts list */}
      {allPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('postsPage.noPosts')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allPosts.map((post) => (
            <Card key={`${post.type}-${post.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">
                      {post.title_ar || post.title_en || t('noTitle')}
                    </CardTitle>
                    {post.title_en && post.title_ar && (
                      <p className="text-sm text-muted-foreground">{post.title_en}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Badge variant={post.status as 'pending' | 'published' | 'rejected' | 'draft'}>
                      {t(`postStatus.${post.status}`)}
                    </Badge>
                    <Badge variant="secondary">
                      {t(`postType.${post.type}`)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString(locale)}
                  </time>
                  {post.status === 'pending' && (
                    <AdminPostActions
                      postId={post.id}
                      postType={post.type as 'project' | 'product' | 'rfq'}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
