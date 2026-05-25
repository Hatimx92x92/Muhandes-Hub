import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPostDetails } from '@/actions/admin/moderation';
import { ProjectForm } from '@/components/forms/project-form';
import { ProductForm } from '@/components/forms/product-form';
import { RFQForm } from '@/components/forms/rfq-form';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

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
      <BreadcrumbOverride segment={rawId} label={(data.title_ar as string) || (data.title_en as string) || ''} />

      {postType === 'project' && (
        <ProjectForm
          mode="admin"
          defaultValues={{
            project_id: postId,
            title_ar: data.title_ar as string,
            title_en: data.title_en as string,
            description_ar: data.description_ar as string,
            description_en: data.description_en as string,
            category_id: data.category_id as string,
            city: data.city_id as string,
            budget_min: data.budget_min as number,
            budget_max: data.budget_max as number,
            timeline_start: data.timeline_start as string,
            timeline_end: data.timeline_end as string,
            classification: data.classification as string,
            source: data.source as string,
            external_link: data.external_link as string,
            status: data.status as string,
            existingFiles: (data.files as Array<{ id: string; file_url: string; file_name: string; file_size: number; category: string; mime_type?: string }>) ?? [],
          }}
        />
      )}

      {postType === 'product' && (
        <ProductForm
          mode="admin"
          defaultValues={{
            product_id: postId,
            name_ar: (data.title_ar as string) || (data.name_ar as string),
            name_en: (data.title_en as string) || (data.name_en as string),
            description_ar: data.description_ar as string,
            description_en: data.description_en as string,
            category_id: data.category_id as string,
            pricing_model: data.pricing_model as string,
            price: data.price as number,
            in_stock: data.in_stock as boolean,
            stock_quantity: data.stock_quantity as number,
            min_order_qty: data.min_order_qty as number,
            lead_time_days: data.lead_time_days as number,
            status: data.status as string,
            variants: ((data.variants as Array<{ name_ar: string; name_en: string; sku: string; price: number; stock_quantity: number }>) ?? []).map(v => ({
              name_ar: v.name_ar || '',
              name_en: v.name_en || '',
              sku: v.sku || '',
              price: String(v.price ?? ''),
              stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : '',
            })),
            existingImages: (data.images as Array<{ id: string; image_url: string; display_order: number; is_primary: boolean }>) ?? [],
            existingSpecs: (data.spec_sheets as Array<{ id: string; file_url: string; file_name: string; file_size: number }>) ?? [],
          }}
        />
      )}

      {postType === 'rfq' && (
        <RFQForm
          mode="admin"
          defaultValues={{
            rfq_id: postId,
            title_ar: data.title_ar as string,
            title_en: data.title_en as string,
            description_ar: data.description_ar as string,
            description_en: data.description_en as string,
            quantity: data.quantity as number,
            budget_min: data.budget_min as number,
            budget_max: data.budget_max as number,
            deadline: data.deadline as string,
            city: data.city_id as string,
            product_id: data.product_id as string,
            status: data.status as string,
            existingFiles: (data.files as Array<{ id: string; file_url: string; file_name: string; file_size: number; category: string; mime_type?: string }>) ?? [],
          }}
        />
      )}
    </div>
  );
}
