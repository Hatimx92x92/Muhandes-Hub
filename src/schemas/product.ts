// =============================================================================
// Muhandes HUB — Product Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Bilingual pair helper: at least one locale must be provided
// ---------------------------------------------------------------------------
function bilingualPair(minLen: number, maxLen: number, label: string) {
  return {
    ar: z.string().max(maxLen).optional(),
    en: z.string().max(maxLen).optional(),
    refine: (arKey: string, enKey: string) => ({
      check: (data: Record<string, unknown>) => {
        const ar = (data[arKey] as string)?.trim();
        const en = (data[enKey] as string)?.trim();
        return (!!ar && ar.length >= minLen) || (!!en && en.length >= minLen);
      },
      message: `At least one language is required for ${label} (min ${minLen} characters)`,
      path: [arKey],
    }),
  };
}

// ---------------------------------------------------------------------------
// Variant Schema
// ---------------------------------------------------------------------------
export const ProductVariantSchema = z.object({
  name_ar: z.string().max(200).optional(),
  name_en: z.string().max(200).optional(),
  sku: z.string().optional(),
  price: z.coerce.number().min(0.01, 'Price is required'),
  stock_quantity: z.coerce.number().int().min(0).optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;

// ---------------------------------------------------------------------------
// Create Product Schema
// ---------------------------------------------------------------------------
const nameFields = bilingualPair(3, 200, 'product name');
const descFields = bilingualPair(10, 5000, 'description');

export const ProductSchema = z.object({
  name_ar: nameFields.ar,
  name_en: nameFields.en,
  description_ar: descFields.ar,
  description_en: descFields.en,
  category_id: z.string().uuid('Please select a valid category').optional(),
  pricing_model: z.enum(['fixed', 'variant']).default('fixed'),
  price: z.coerce.number().min(0.01, 'Price is required').optional(),
  in_stock: z.coerce.boolean().default(true),
  stock_quantity: z.coerce.number().int().min(0).optional(),
  min_order_qty: z.coerce.number().int().min(1).default(1),
  lead_time_days: z.coerce.number().int().min(0).optional(),
  variants: z.array(ProductVariantSchema).optional(),
}).refine(
  (data) => nameFields.refine('name_ar', 'name_en').check(data),
  { message: nameFields.refine('name_ar', 'name_en').message, path: ['name_ar'] },
).refine(
  (data) => descFields.refine('description_ar', 'description_en').check(data),
  { message: descFields.refine('description_ar', 'description_en').message, path: ['description_ar'] },
).refine(
  (data) => {
    if (data.pricing_model === 'fixed') {
      return data.price != null && data.price > 0;
    }
    return true;
  },
  { message: 'Price is required for fixed-price products', path: ['price'] },
).refine(
  (data) => {
    if (data.pricing_model === 'variant') {
      return data.variants && data.variants.length > 0;
    }
    return true;
  },
  { message: 'At least one variant is required', path: ['variants'] },
);

export type ProductInput = z.infer<typeof ProductSchema>;

// ---------------------------------------------------------------------------
// Update Product Schema (same fields + id)
// ---------------------------------------------------------------------------
export const UpdateProductSchema = ProductSchema.and(
  z.object({ product_id: z.string().uuid() }),
);

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// ---------------------------------------------------------------------------
// Submit for Approval
// ---------------------------------------------------------------------------
export const SubmitProductForApprovalSchema = z.object({
  product_id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Delete Product
// ---------------------------------------------------------------------------
export const DeleteProductSchema = z.object({
  product_id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Bulk Actions
// ---------------------------------------------------------------------------
export const BulkProductIdsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'Select at least one product').max(100),
});

export const BulkUpdateStatusSchema = BulkProductIdsSchema.extend({
  status: z.enum(['draft', 'published']),
});

export const BulkUpdatePriceSchema = BulkProductIdsSchema.extend({
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
});

export const BulkUpdateStockSchema = BulkProductIdsSchema.extend({
  in_stock: z.coerce.boolean(),
  stock_quantity: z.coerce.number().int().min(0).optional(),
});
