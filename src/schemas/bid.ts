// =============================================================================
// Bid Schemas — Zod v4
// =============================================================================

import { z } from 'zod/v4';

// -- Submit Bid ---------------------------------------------------------------
export const BidSchema = z.object({
  project_id: z.string().uuid(),
  amount: z.coerce.number().min(1, 'Amount is required'),
  timeline_days: z.coerce.number().int().min(1, 'Timeline is required'),
  methodology_ar: z.string().min(10, 'Arabic methodology description required (min 10 characters)').optional().or(z.literal('')),
  methodology_en: z.string().min(10, 'Methodology in English required (min 10 chars)').optional().or(z.literal('')),
});

export type BidInput = z.infer<typeof BidSchema>;

// -- Update Bid ---------------------------------------------------------------
export const UpdateBidSchema = BidSchema.omit({ project_id: true }).and(
  z.object({ bid_id: z.string().uuid() }),
);

export type UpdateBidInput = z.infer<typeof UpdateBidSchema>;

// -- Shortlist / Award / Reject Bid ------------------------------------------
export const ShortlistBidSchema = z.object({
  bid_id: z.string().uuid(),
});

export const AwardBidSchema = z.object({
  bid_id: z.string().uuid(),
});

export const RejectBidSchema = z.object({
  bid_id: z.string().uuid(),
  reason_ar: z.string().optional(),
  reason_en: z.string().optional(),
});
