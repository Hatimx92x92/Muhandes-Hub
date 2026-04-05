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

// -- Invite to Quote (replaces Direct Hire) -----------------------------------
export const InviteToQuoteSchema = z.object({
  supplier_id: z.string().uuid(),
  project_id: z.string().uuid(),
  description_ar: z.string().min(10, 'Description must be at least 10 characters'),
  description_en: z.string().optional(),
});

export type InviteToQuoteInput = z.infer<typeof InviteToQuoteSchema>;

// Backward compat alias — remove after full migration
export const DirectHireSchema = InviteToQuoteSchema;
export type DirectHireInput = InviteToQuoteInput;
