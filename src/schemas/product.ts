// =============================================================================
// Muqawil HUB — Product Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Variant Schema
// ---------------------------------------------------------------------------
export const ProductVariantSchema = z.object({
  name_ar: z.string().min(1, 'Variant name in Arabic is required'),
  name_en: z.string().min(1, 'Variant name in English is required'),
  sku: z.string().optional(),
  price: z.coerce.number().min(0.01, 'Price is required'),
  stock_quantity: z.coerce.number().int().min(0).optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;

// ---------------------------------------------------------------------------
// Create Product Schema
// ---------------------------------------------------------------------------
export const ProductSchema = z.object({
  name_ar: z.string().min(3, 'Product name in Arabic required (min 3 characters)').max(200),
  name_en: z.string().min(3, 'Product name in English required (min 3 chars)').max(200),
  description_ar: z.string().min(10, 'Arabic description required (min 10 characters)').max(5000),
  description_en: z.string().min(10, 'English description required (min 10 chars)').max(5000),
  category_id: z.string().uuid('Please select a valid category').optional(),
  pricing_model: z.enum(['fixed', 'variant']).default('fixed'),
  price: z.coerce.number().min(0.01, 'Price is required').optional(),
  in_stock: z.coerce.boolean().default(true),
  stock_quantity: z.coerce.number().int().min(0).optional(),
  min_order_qty: z.coerce.number().int().min(1).default(1),
  lead_time_days: z.coerce.number().int().min(0).optional(),
  variants: z.array(ProductVariantSchema).optional(),
}).refine(
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
