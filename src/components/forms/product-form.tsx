'use client';

// =============================================================================
// Muqawil HUB — Product Form (Create/Edit)
// =============================================================================

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/forms/currency-input';
import { VariantEditor, type VariantRow } from '@/components/forms/variant-editor';
import { createProduct, updateProduct } from '@/actions/products';
import type { ActionResult } from '@/types';

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
  };
}

export function ProductForm({ mode, defaultValues }: ProductFormProps) {
  const t = useTranslations('forms.product');
  const action = mode === 'create' ? createProduct : updateProduct;
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string; status?: string }> | null,
    FormData
  >(action as (state: ActionResult<{ id: string; status?: string }> | null, formData: FormData) => Promise<ActionResult<{ id: string; status?: string }>>, null);

  const [pricingModel, setPricingModel] = useState(defaultValues?.pricing_model || 'fixed');
  const [variants, setVariants] = useState<VariantRow[]>(defaultValues?.variants || []);

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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Success */}
      {state?.data && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          {mode === 'create' ? t('createSuccess') : t('updateSuccess')}
        </div>
      )}

      {/* Section: Product Info */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('infoTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="name_ar"
            label={t('nameAr')}
            defaultValue={defaultValues?.name_ar}
            error={getError('name_ar')}
            required
          />
          <Input
            name="name_en"
            label={t('nameEn')}
            defaultValue={defaultValues?.name_en}
            error={getError('name_en')}
            dir="ltr"
            required
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Textarea
            name="description_ar"
            label={t('descAr')}
            defaultValue={defaultValues?.description_ar}
            error={getError('description_ar')}
            rows={4}
            required
          />
          <Textarea
            name="description_en"
            label={t('descEn')}
            defaultValue={defaultValues?.description_en}
            error={getError('description_en')}
            dir="ltr"
            rows={4}
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
          <p className="mt-2 text-sm text-red-500">{getError('variants')}</p>
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
            <select
              id="in_stock"
              name="in_stock"
              defaultValue={defaultValues?.in_stock === false ? 'false' : 'true'}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="true">{t('inStock')}</option>
              <option value="false">{t('outOfStock')}</option>
            </select>
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

      {/* TODO: Image gallery and spec sheet upload (Tasks #115-116) */}

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {mode === 'create' ? t('createProduct') : t('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
