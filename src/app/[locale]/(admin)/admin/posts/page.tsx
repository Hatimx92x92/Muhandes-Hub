import { getTranslations } from 'next-intl/server';
import { getAdminPosts, type AdminQueryParams } from '@/actions/admin/queries';
import { PostsTableClient } from './posts-table-client';

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations('admin');
  const tp = await getTranslations('features.adminPost');
  const params = await searchParams;

  const queryParams: AdminQueryParams = {
    page: Number(params.page) || 1,
    search: params.search,
    sort: params.sort,
    filters: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.type ? { type: params.type } : {}),
    },
  };

  const result = await getAdminPosts(queryParams);

  const translations: Record<string, string> = {
    col_title: t('table.columns.title'),
    col_type: t('table.columns.type'),
    col_status: t('table.columns.status'),
    col_id: 'ID',
    col_created: t('table.columns.created'),
    col_actions: t('table.columns.actions'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    postStatus_pending: t('postStatus.pending'),
    postStatus_published: t('postStatus.published'),
    postStatus_rejected: t('postStatus.rejected'),
    postStatus_draft: t('postStatus.draft'),
    type_project: t('postType.project'),
    type_product: t('postType.product'),
    type_rfq: t('postType.rfq'),
    noTitle: t('noTitle'),
    noPosts: t('postsPage.noPosts'),
    searchPlaceholder: t('postsPage.title'),
    action_approve: tp('approve'),
    action_reject: tp('reject'),
    editPost: t('postEdit.editPost'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('postsPage.title')}</h1>
        <p className="text-muted-foreground">{t('postsPage.subtitle')}</p>
      </div>

      <PostsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
