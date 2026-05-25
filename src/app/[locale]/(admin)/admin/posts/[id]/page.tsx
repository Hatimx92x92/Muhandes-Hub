import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPostDetails } from '@/actions/admin/moderation';
import { PostDetailView } from '@/components/features/admin/post-detail-view';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

export default async function AdminPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;

  // The URL format is: /admin/posts/{type}-{id}
  const separatorIdx = rawId.indexOf('-');
  if (separatorIdx < 0) redirect('/admin/posts');

  const postType = rawId.substring(0, separatorIdx) as 'project' | 'product' | 'rfq';
  const postId = rawId.substring(separatorIdx + 1);

  if (!['project', 'product', 'rfq'].includes(postType)) redirect('/admin/posts');

  const { data, error } = await getPostDetails(postId, postType);
  if (error || !data) redirect('/admin/posts');

  const t = await getTranslations('admin.postDetail');

  return (
    <div className="space-y-6">
      <BreadcrumbOverride
        segment={rawId}
        label={(data.title_ar as string) || (data.title_en as string) || ''}
      />

      <PostDetailView
        postId={postId}
        postType={postType}
        data={data}
      />
    </div>
  );
}
