// =============================================================================
// Review & Commission Schemas — Zod v4
// =============================================================================

import { z } from 'zod/v4';

// -- Submit Review ------------------------------------------------------------
export const ReviewSchema = z.object({
  deal_id: z.string().uuid(),
  overall_rating: z.coerce.number().int().min(1, 'Rating is required').max(5),
  quality_rating: z.coerce.number().int().min(1).max(5).optional(),
  timeliness_rating: z.coerce.number().int().min(1).max(5).optional(),
  communication_rating: z.coerce.number().int().min(1).max(5).optional(),
  would_recommend: z
    .string()
    .transform((v) => v === 'true')
    .or(z.boolean()),
  comment_ar: z.string().max(2000).optional().or(z.literal('')),
  comment_en: z.string().max(2000).optional().or(z.literal('')),
});

export type ReviewInput = z.infer<typeof ReviewSchema>;

// -- Edit Review (subset of fields) ------------------------------------------
export const EditReviewSchema = z.object({
  review_id: z.string().uuid(),
  overall_rating: z.coerce.number().int().min(1).max(5).optional(),
  quality_rating: z.coerce.number().int().min(1).max(5).optional(),
  timeliness_rating: z.coerce.number().int().min(1).max(5).optional(),
  communication_rating: z.coerce.number().int().min(1).max(5).optional(),
  would_recommend: z
    .string()
    .transform((v) => v === 'true')
    .or(z.boolean())
    .optional(),
  comment_ar: z.string().max(2000).optional().or(z.literal('')),
  comment_en: z.string().max(2000).optional().or(z.literal('')),
});

export type EditReviewInput = z.infer<typeof EditReviewSchema>;

// -- Pay Commission -----------------------------------------------------------
export const PayCommissionSchema = z.object({
  commission_id: z.string().uuid(),
  method: z.enum(['card', 'bank_transfer']),
});

export type PayCommissionInput = z.infer<typeof PayCommissionSchema>;

// -- Dispute Commission -------------------------------------------------------
export const DisputeCommissionSchema = z.object({
  commission_id: z.string().uuid(),
  reason: z.string().min(10, 'Dispute reason required (min 10 characters)').max(2000),
});

export type DisputeCommissionInput = z.infer<typeof DisputeCommissionSchema>;
