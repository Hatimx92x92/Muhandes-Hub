// =============================================================================
// Product Inquiry & Direct Hire Schemas — Zod v4
// =============================================================================

import { z } from 'zod/v4';

// -- Product Inquiry ----------------------------------------------------------
export const ProductInquirySchema = z.object({
  product_id: z.string().uuid(),
  message_ar: z.string().min(10, 'Message must be at least 10 characters'),
  message_en: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity is required').optional(),
});

export type ProductInquiryInput = z.infer<typeof ProductInquirySchema>;

// -- Direct Hire Request ------------------------------------------------------
export const DirectHireSchema = z.object({
  supplier_id: z.string().uuid(),
  description_ar: z.string().min(10, 'Description must be at least 10 characters'),
  description_en: z.string().optional(),
  budget: z.coerce.number().min(1, 'Budget is required').optional(),
  project_id: z.string().uuid().optional(),
});

export type DirectHireInput = z.infer<typeof DirectHireSchema>;
