// =============================================================================
// RFQ Schemas — Zod v4
// =============================================================================

import { z } from 'zod/v4';

// -- Create RFQ ---------------------------------------------------------------
export const RFQSchema = z.object({
  title_ar: z.string().optional(),
  title_en: z.string().optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  category_id: z.string().uuid().optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  budget_min: z.coerce.number().min(0).optional(),
  budget_max: z.coerce.number().min(0).optional(),
  deadline: z.string().optional(), // ISO date
  city: z.string().optional(),
  project_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
}).refine(
  (data) => {
    const ar = data.title_ar?.trim();
    const en = data.title_en?.trim();
    return (!!ar && ar.length >= 5) || (!!en && en.length >= 5);
  },
  { message: 'At least one language is required for title (min 5 characters)', path: ['title_ar'] },
).refine(
  (data) => {
    const ar = data.description_ar?.trim();
    const en = data.description_en?.trim();
    return (!!ar && ar.length >= 20) || (!!en && en.length >= 20);
  },
  { message: 'At least one language is required for description (min 20 characters)', path: ['description_ar'] },
).refine(
  (d) => !d.budget_min || !d.budget_max || d.budget_max >= d.budget_min,
  { message: 'Maximum must be greater than minimum', path: ['budget_max'] },
);

export type RFQInput = z.infer<typeof RFQSchema>;

// -- Update RFQ ---------------------------------------------------------------
export const UpdateRFQSchema = RFQSchema.and(
  z.object({ rfq_id: z.string().uuid() }),
);

// -- RFQ Response -------------------------------------------------------------
export const RFQResponseSchema = z.object({
  rfq_id: z.string().uuid(),
  pricing: z.string().min(1, 'Pricing is required'), // JSON string with line items
  delivery_terms_ar: z.string().optional(),
  delivery_terms_en: z.string().optional(),
  notes_ar: z.string().optional(),
  notes_en: z.string().optional(),
});

export type RFQResponseInput = z.infer<typeof RFQResponseSchema>;

// -- Submit / Accept / Reject -------------------------------------------------
export const SubmitRFQForApprovalSchema = z.object({
  rfq_id: z.string().uuid(),
});

export const AcceptRFQResponseSchema = z.object({
  response_id: z.string().uuid(),
});

export const RejectRFQResponseSchema = z.object({
  response_id: z.string().uuid(),
  reason: z.string().optional(),
});
