import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { getPostDetails } from '@/actions/admin/moderation';
import { PostEditForm } from '@/components/features/admin/post-edit-form';

export default async function AdminPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations('admin.postEdit');
  const { id: rawId } = await params;

  // The URL format is: /admin/posts/{type}-{id}/edit
  const separatorIdx = rawId.indexOf('-');
  if (separatorIdx < 0) redirect('/admin/posts');

  const postType = rawId.substring(0, separatorIdx) as 'project' | 'product' | 'rfq';
  const postId = rawId.substring(separatorIdx + 1);

  if (!['project', 'product', 'rfq'].includes(postType)) redirect('/admin/posts');

  const { data, error } = await getPostDetails(postId, postType);
  if (error || !data) redirect('/admin/posts');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/posts" className="text-sm text-muted-foreground hover:text-foreground">
          {t('title')}
        </Link>
        <ArrowRight className="h-3 w-3 text-muted-foreground rtl:rotate-180" />
        <span className="text-sm font-medium">{t('editPost')}</span>
      </div>

      <PostEditForm
        postId={postId}
        postType={postType}
        initialData={{
          title_ar: data.title_ar as string,
          title_en: data.title_en as string,
          description_ar: data.description_ar as string,
          description_en: data.description_en as string,
          status: data.status as string,
        }}
      />
    </div>
  );
}
