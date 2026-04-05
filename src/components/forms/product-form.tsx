'use client';

// =============================================================================
// Muhandes HUB — Product Form (Create/Edit)
// =============================================================================

import { useActionState, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BilingualFieldPair } from '@/components/ui/bilingual-field-pair';
import { CurrencyInput } from '@/components/forms/currency-input';
import { VariantEditor, type VariantRow } from '@/components/forms/variant-editor';
import { FileUpload } from '@/components/forms/file-upload';
import { createProduct, updateProduct, removeProductImage, removeProductSpecSheet, setPrimaryImage } from '@/actions/products';
import { AlertBanner } from '@/components/ui/alert-banner';
import { X, Star, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionResult } from '@/types';

interface ExistingImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface ExistingSpec {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  defaultValues?: {
    product_id?: string;
    name_ar?: string;
    name_en?: string;
    description_ar?: string;
    description_en?: string;
    category_id?: string;
    pricing_model?: string;
    price?: number;
    in_stock?: boolean;
    stock_quantity?: number;
    min_order_qty?: number;
    lead_time_days?: number;
    variants?: VariantRow[];
    existingImages?: ExistingImage[];
    existingSpecs?: ExistingSpec[];
  };
}

export function ProductForm({ mode, defaultValues }: ProductFormProps) {
  const t = useTranslations('forms.product');
  const tMedia = useTranslations('forms.product.media');
  const action = mode === 'create' ? createProduct : updateProduct;
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string; status?: string }> | null,
    FormData
  >(action as (state: ActionResult<{ id: string; status?: string }> | null, formData: FormData) => Promise<ActionResult<{ id: string; status?: string }>>, null);

  const [pricingModel, setPricingModel] = useState(defaultValues?.pricing_model || 'fixed');
  const [variants, setVariants] = useState<VariantRow[]>(defaultValues?.variants || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [specFiles, setSpecFiles] = useState<File[]>([]);
  const [images, setImages] = useState<ExistingImage[]>(defaultValues?.existingImages ?? []);
  const [specs, setSpecs] = useState<ExistingSpec[]>(defaultValues?.existingSpecs ?? []);
  const [isRemoving, startRemoveTransition] = useTransition();

  const getError = (field: string) =>
    state?.error ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form
      action={(formData) => {
        // Inject variants as JSON into FormData
        if (pricingModel === 'variant') {
          const variantsData = variants.map((v, i) => ({
            name_ar: v.name_ar,
            name_en: v.name_en,
            sku: v.sku || undefined,
            price: parseFloat(v.price) || 0,
            stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity) : undefined,
            sort_order: i,
          }));
          formData.set('variants', JSON.stringify(variantsData));
        }
        formData.set('pricing_model', pricingModel);

        // Append image and spec files
        imageFiles.forEach((file) => formData.append('image_files', file));
        specFiles.forEach((file) => formData.append('spec_files', file));

        formAction(formData);
      }}
      className="space-y-8"
    >
      {/* Hidden fields */}
      {mode === 'edit' && defaultValues?.product_id && (
        <input type="hidden" name="product_id" value={defaultValues.product_id} />
      )}

      {/* Global error */}
      {state?.error && !state.fieldErrors && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Success */}
      {state?.data && (
        <AlertBanner variant="success">{mode === 'create' ? t('createSuccess') : t('updateSuccess')}</AlertBanner>
      )}

      {/* Section: Product Info */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('infoTitle')}</h2>
        <BilingualFieldPair
          baseName="name"
          labelAr={t('nameAr')}
          labelEn={t('nameEn')}
          defaultValueAr={defaultValues?.name_ar}
          defaultValueEn={defaultValues?.name_en}
          errorAr={getError('name_ar')}
          errorEn={getError('name_en')}
          required
        />
        <div className="mt-4">
          <BilingualFieldPair
            baseName="description"
            type="textarea"
            rows={4}
            labelAr={t('descAr')}
            labelEn={t('descEn')}
            defaultValueAr={defaultValues?.description_ar}
            defaultValueEn={defaultValues?.description_en}
            errorAr={getError('description_ar')}
            errorEn={getError('description_en')}
            required
          />
        </div>
      </section>

      {/* Section: Pricing */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('pricingTitle')}</h2>

        {/* Pricing model toggle */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t('pricingModel')}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPricingModel('fixed')}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                pricingModel === 'fixed'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t('fixedPrice')}
            </button>
            <button
              type="button"
              onClick={() => setPricingModel('variant')}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                pricingModel === 'variant'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t('variantBased')}
            </button>
          </div>
        </div>

        {pricingModel === 'fixed' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencyInput
              name="price"
              label={t('price')}
              defaultValue={defaultValues?.price}
              error={getError('price')}
            />
            <Input
              type="number"
              name="stock_quantity"
              label={t('stockQuantity')}
              defaultValue={defaultValues?.stock_quantity?.toString()}
              min="0"
            />
          </div>
        ) : (
          <VariantEditor value={variants} onChange={setVariants} />
        )}
        {getError('variants') && (
          <p className="mt-2 text-sm text-destructive">{getError('variants')}</p>
        )}
      </section>

      {/* Section: Availability */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('availabilityTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="in_stock" className="mb-1.5 block text-sm font-medium text-foreground">
              {t('stockStatus')}
            </label>
            <Select name="in_stock" defaultValue={defaultValues?.in_stock === false ? 'false' : 'true'}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('inStock')}</SelectItem>
                <SelectItem value="false">{t('outOfStock')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            type="number"
            name="min_order_qty"
            label={t('minOrderQty')}
            defaultValue={defaultValues?.min_order_qty?.toString() || '1'}
            min="1"
          />
          <Input
            type="number"
            name="lead_time_days"
            label={t('leadTimeDays')}
            defaultValue={defaultValues?.lead_time_days?.toString()}
            min="0"
          />
        </div>
      </section>

      {/* Section: Images */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{tMedia('imagesTitle')}</h2>

        {/* Existing images (edit mode) */}
        {mode === 'edit' && images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1">
                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={() => {
                      if (!defaultValues?.product_id) return;
                      startRemoveTransition(async () => {
                        await setPrimaryImage(defaultValues.product_id!, img.id);
                        setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === img.id })));
                      });
                    }}
                    className={cn(
                      'rounded p-1 transition-colors',
                      img.is_primary ? 'text-yellow-400' : 'text-white/60 hover:text-yellow-400',
                    )}
                    title={tMedia('setPrimary')}
                  >
                    <Star className="h-4 w-4" fill={img.is_primary ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={() => {
                      if (!defaultValues?.product_id) return;
                      startRemoveTransition(async () => {
                        await removeProductImage(defaultValues.product_id!, img.id);
                        setImages((prev) => prev.filter((i) => i.id !== img.id));
                      });
                    }}
                    className="rounded p-1 text-white/60 transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <FileUpload
          name="images"
          accept="image/jpeg,image/png,image/webp"
          multiple
          maxSize={5}
          maxFiles={10}
          hint={tMedia('imageHint')}
          onUpload={setImageFiles}
        />
      </section>

      {/* Section: Spec Sheets / Catalogs */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{tMedia('specsTitle')}</h2>

        {/* Existing specs (edit mode) */}
        {mode === 'edit' && specs.length > 0 && (
          <ul className="mb-4 space-y-2">
            {specs.map((spec) => (
              <li
                key={spec.id}
                className="flex items-center gap-2 rounded-lg border p-2 text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a
                  href={spec.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-primary underline-offset-2 hover:underline"
                >
                  {spec.file_name}
                </a>
                <span className="text-xs text-muted-foreground">
                  {(spec.file_size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  disabled={isRemoving}
                  onClick={() => {
                    if (!defaultValues?.product_id) return;
                    startRemoveTransition(async () => {
                      await removeProductSpecSheet(defaultValues.product_id!, spec.id);
                      setSpecs((prev) => prev.filter((s) => s.id !== spec.id));
                    });
                  }}
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <FileUpload
          name="specs"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
          multiple
          maxSize={10}
          maxFiles={5}
          hint={tMedia('specHint')}
          onUpload={setSpecFiles}
        />
      </section>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {mode === 'create' ? t('createProduct') : t('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
