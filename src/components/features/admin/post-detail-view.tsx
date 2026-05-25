'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPostActions } from '@/components/features/admin/post-actions';
import {
  FileText,
  Pencil,
  ArrowRight,
  ExternalLink,
  User,
  MapPin,
  Calendar,
  Banknote,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { getProxyUrl } from '@/lib/file-utils';
import { FileActions } from '@/components/features/file-actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FileRecord {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type?: string;
  category: string;
  created_at: string;
}

interface ImageRecord {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface VariantRecord {
  id: string;
  name_ar: string;
  name_en: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number | null;
}

interface SpecSheetRecord {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
}

interface OwnerRecord {
  id: string;
  full_name?: string;
  company_name_ar?: string;
  company_name_en?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface CityRecord {
  name_ar?: string;
  name_en?: string;
}

interface CategoryRecord {
  name_ar?: string;
  name_en?: string;
}

interface PostDetailViewProps {
  postId: string;
  postType: 'project' | 'product' | 'rfq';
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PostDetailView({ postId, postType, data }: PostDetailViewProps) {
  const t = useTranslations('admin.postDetail');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();

  const files = (data.files as FileRecord[]) ?? [];
  const images = (data.images as ImageRecord[]) ?? [];
  const variants = (data.variants as VariantRecord[]) ?? [];
  const specSheets = (data.spec_sheets as SpecSheetRecord[]) ?? [];
  const owner = data.owner as OwnerRecord | null;
  const city = data.city as CityRecord | null;
  const category = data.category as CategoryRecord | null;

  // Extract typed fields from data
  const titleAr = String(data.title_ar ?? '');
  const titleEn = String(data.title_en ?? '');
  const descAr = String(data.description_ar ?? '');
  const descEn = String(data.description_en ?? '');
  const status = String(data.status ?? 'draft');
  const rejectionReasonAr = String(data.rejection_reason_ar ?? '');
  const rejectionReasonEn = String(data.rejection_reason_en ?? '');
  const classification = String(data.classification ?? '');
  const source = String(data.source ?? '');
  const externalLink = String(data.external_link ?? '');
  const createdAt = String(data.created_at ?? '');
  const updatedAt = String(data.updated_at ?? '');
  const budgetMin = data.budget_min as number | null;
  const budgetMax = data.budget_max as number | null;
  const timelineStart = String(data.timeline_start ?? '');
  const timelineEnd = String(data.timeline_end ?? '');

  // Product-specific fields
  const pricingModel = String(data.pricing_model ?? '');
  const price = data.price as number | null;
  const inStock = data.in_stock as boolean | null;
  const stockQuantity = data.stock_quantity as number | null;
  const minOrderQty = data.min_order_qty as number | null;
  const leadTimeDays = data.lead_time_days as number | null;

  // RFQ-specific fields
  const quantity = data.quantity as number | null;
  const deadline = String(data.deadline ?? '');
  const responseCount = data.response_count as number | null;

  const isImage = (mime?: string) =>
    mime?.startsWith('image/') ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {titleAr || titleEn || t('untitled')}
          </h1>
          {titleEn && titleAr && (
            <p className="text-sm text-muted-foreground">{titleEn}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status as 'pending' | 'published' | 'rejected' | 'draft'}>
            {tAdmin(`postStatus.${status}`)}
          </Badge>
          <Badge variant="secondary">{tAdmin(`postType.${postType}`)}</Badge>
          <Link href={`/admin/posts/${postType}-${postId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="me-1.5 h-4 w-4" />
              {tAdmin('postEdit.editPost')}
            </Button>
          </Link>
          {status === 'pending' && (
            <AdminPostActions postId={postId} postType={postType} />
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {status === 'rejected' && (rejectionReasonAr || rejectionReasonEn) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">{t('rejectionReason')}</p>
            <p className="mt-1 text-sm text-foreground">
              {locale === 'ar'
                ? rejectionReasonAr || rejectionReasonEn
                : rejectionReasonEn || rejectionReasonAr}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — left 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('description')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {descAr && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{t('arabic')}</p>
                  <p dir="rtl" className="whitespace-pre-wrap text-sm text-foreground">
                    {descAr}
                  </p>
                </div>
              )}
              {descEn && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{t('english')}</p>
                  <p dir="ltr" className="whitespace-pre-wrap text-sm text-foreground">
                    {descEn}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files Section (project-specific) */}
          {postType === 'project' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('files')}
                    <Badge variant="secondary">{files.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noFiles')}</p>
                ) : (
                  <ul className="space-y-3">
                    {files.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {/* Thumbnail for images */}
                        {isImage(file.mime_type) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getProxyUrl(file.file_url)}
                            alt={file.file_name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {file.file_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">
                              {file.category}
                            </Badge>
                            <span>{(file.file_size / 1024).toFixed(0)} KB</span>
                            {file.mime_type && <span>{file.mime_type}</span>}
                          </div>
                        </div>

                        <FileActions url={file.file_url} fileName={file.file_name} compact />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Images Section */}
          {postType === 'product' && images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    {t('productImages')}
                    <Badge variant="secondary">{images.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative rounded-lg border overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProxyUrl(img.image_url)}
                        alt={`Product image ${img.display_order}`}
                        className="aspect-square w-full object-cover"
                      />
                      {img.is_primary && (
                        <Badge variant="default" className="absolute top-1.5 start-1.5 text-[10px]">
                          {t('primaryImage')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Variants Section */}
          {postType === 'product' && variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('variants')}
                  <Badge variant="secondary" className="ms-2">{variants.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-start text-xs text-muted-foreground">
                        <th className="pb-2 pe-3 font-medium">{t('variantName')}</th>
                        <th className="pb-2 pe-3 font-medium">SKU</th>
                        <th className="pb-2 pe-3 font-medium">{t('variantPrice')}</th>
                        <th className="pb-2 font-medium">{t('variantStock')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id} className="border-b last:border-0">
                          <td className="py-2 pe-3">
                            {locale === 'ar' ? v.name_ar || v.name_en : v.name_en || v.name_ar}
                          </td>
                          <td className="py-2 pe-3 font-mono text-xs">{v.sku ?? '—'}</td>
                          <td className="py-2 pe-3">{v.price != null ? formatSAR(v.price, locale) : '—'}</td>
                          <td className="py-2">{v.stock_quantity ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Spec Sheets Section */}
          {postType === 'product' && specSheets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('specSheets')}
                    <Badge variant="secondary">{specSheets.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {specSheets.map((sheet) => (
                    <li
                      key={sheet.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{sheet.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(sheet.file_size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <FileActions url={sheet.file_url} fileName={sheet.file_name} compact />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category (all types) */}
              {category && (
                <div className="flex items-start gap-2">
                  <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('category')}</p>
                    <p className="text-sm font-medium">
                      {locale === 'ar' ? category.name_ar : category.name_en}
                    </p>
                  </div>
                </div>
              )}

              {/* City */}
              {city && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('city')}</p>
                    <p className="text-sm font-medium">
                      {locale === 'ar' ? city.name_ar : city.name_en}
                    </p>
                  </div>
                </div>
              )}

              {/* Budget */}
              {(budgetMin != null || budgetMax != null) && (
                <div className="flex items-start gap-2">
                  <Banknote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('budget')}</p>
                    <p className="text-sm font-medium">
                      {budgetMin != null && formatSAR(budgetMin, locale)}
                      {budgetMin != null && budgetMax != null && ' — '}
                      {budgetMax != null && formatSAR(budgetMax, locale)}
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {(timelineStart || timelineEnd) && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('timeline')}</p>
                    <p className="text-sm font-medium">
                      {timelineStart &&
                        new Date(timelineStart).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                        )}
                      {timelineStart && timelineEnd && ' → '}
                      {timelineEnd &&
                        new Date(timelineEnd).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                        )}
                    </p>
                  </div>
                </div>
              )}

              {/* Classification */}
              {classification && (
                <div className="flex items-start gap-2">
                  <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('classification')}</p>
                    <p className="text-sm font-medium uppercase">
                      {t('class')} {classification.toUpperCase()}
                    </p>
                  </div>
                </div>
              )}

              {/* Source */}
              {source && (
                <div className="flex items-start gap-2">
                  <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('source')}</p>
                    <p className="text-sm font-medium">
                      {source === 'owner' ? t('sourceOwner') : t('sourceSubcontract')}
                    </p>
                  </div>
                </div>
              )}

              {/* External Link */}
              {externalLink && (
                <div className="flex items-start gap-2">
                  <ExternalLink className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('externalLink')}</p>
                    <a
                      href={externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary underline-offset-2 hover:underline break-all"
                    >
                      {externalLink}
                    </a>
                  </div>
                </div>
              )}

              {/* Product-specific: Pricing Model & Price */}
              {postType === 'product' && (
                <>
                  {pricingModel && (
                    <div className="flex items-start gap-2">
                      <Banknote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('pricingModel')}</p>
                        <p className="text-sm font-medium">{t(`pricing_${pricingModel}`)}</p>
                      </div>
                    </div>
                  )}
                  {price != null && (
                    <div className="flex items-start gap-2">
                      <Banknote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('price')}</p>
                        <p className="text-sm font-medium">{formatSAR(price, locale)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('stockStatus')}</p>
                      <p className="text-sm font-medium">
                        {inStock ? t('inStock') : t('outOfStock')}
                        {stockQuantity != null && ` (${stockQuantity})`}
                      </p>
                    </div>
                  </div>
                  {minOrderQty != null && (
                    <div className="flex items-start gap-2">
                      <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('minOrderQty')}</p>
                        <p className="text-sm font-medium">{minOrderQty}</p>
                      </div>
                    </div>
                  )}
                  {leadTimeDays != null && (
                    <div className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('leadTime')}</p>
                        <p className="text-sm font-medium">{leadTimeDays} {t('days')}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* RFQ-specific: Quantity, Deadline, Responses */}
              {postType === 'rfq' && (
                <>
                  {quantity != null && (
                    <div className="flex items-start gap-2">
                      <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('quantity')}</p>
                        <p className="text-sm font-medium">{quantity}</p>
                      </div>
                    </div>
                  )}
                  {deadline && (
                    <div className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('deadline')}</p>
                        <p className="text-sm font-medium">
                          {new Date(deadline).toLocaleDateString(
                            locale === 'ar' ? 'ar-SA' : 'en-US',
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {responseCount != null && (
                    <div className="flex items-start gap-2">
                      <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('responseCount')}</p>
                        <p className="text-sm font-medium">{responseCount}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Dates */}
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  {t('createdAt')}: {createdAt && new Date(createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
                {updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    {t('updatedAt')}: {new Date(updatedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Owner Info */}
          {owner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('owner')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {owner.full_name && (
                  <p className="text-sm font-medium">{owner.full_name}</p>
                )}
                {(owner.company_name_ar || owner.company_name_en) && (
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar'
                      ? owner.company_name_ar || owner.company_name_en
                      : owner.company_name_en || owner.company_name_ar}
                  </p>
                )}
                {owner.email && (
                  <p className="text-sm text-muted-foreground">{owner.email}</p>
                )}
                {owner.phone && (
                  <p className="text-sm text-muted-foreground">{owner.phone}</p>
                )}
                {owner.role && (
                  <Badge variant="secondary">{owner.role}</Badge>
                )}
                <div className="pt-2">
                  <Link href={`/admin/users/${owner.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      {t('viewProfile')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
