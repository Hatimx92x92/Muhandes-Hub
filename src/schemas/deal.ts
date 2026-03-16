// =============================================================================
// Muqawil HUB — Deal & Milestone Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Milestone
// ---------------------------------------------------------------------------

export const MilestoneSchema = z.object({
  deal_id: z.string().uuid(),
  title_ar: z.string().min(3, 'Milestone title is required (min 3 characters)'),
  title_en: z.string().optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  due_date: z.string().optional(), // ISO date string
  payment_amount: z.coerce.number().min(0).optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type MilestoneInput = z.infer<typeof MilestoneSchema>;

// ---------------------------------------------------------------------------
// Milestone Suggestion (seller proposes changes)
// ---------------------------------------------------------------------------

export const MilestoneSuggestionSchema = z.object({
  milestone_id: z.string().uuid(),
  title_ar: z.string().min(3).optional(),
  title_en: z.string().optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  due_date: z.string().optional(),
  payment_amount: z.coerce.number().min(0).optional(),
});

export type MilestoneSuggestionInput = z.infer<typeof MilestoneSuggestionSchema>;

// ---------------------------------------------------------------------------
// Proof Submission
// ---------------------------------------------------------------------------

export const ProofSchema = z.object({
  deal_id: z.string().uuid(),
  milestone_id: z.string().uuid().optional(),
  proof_type: z.enum(['payment', 'work', 'supply', 'handover']),
  description: z.string().min(5, 'Proof description required (min 5 characters)'),
  percentage_claim: z.coerce.number().int().min(0).max(100),
  // File URLs handled separately via upload
});

export type ProofInput = z.infer<typeof ProofSchema>;

// ---------------------------------------------------------------------------
// Proof Rejection
// ---------------------------------------------------------------------------

export const ProofRejectionSchema = z.object({
  proof_id: z.string().uuid(),
  rejection_reason: z.enum([
    'incomplete_work',
    'poor_quality',
    'wrong_scope',
    'missing_documentation',
    'other',
  ]),
  rejection_text: z.string().optional(),
});

export type ProofRejectionInput = z.infer<typeof ProofRejectionSchema>;

// ---------------------------------------------------------------------------
// Deal Cancellation Request
// ---------------------------------------------------------------------------

export const CancelRequestSchema = z.object({
  deal_id: z.string().uuid(),
  reason: z.string().min(10, 'Cancellation reason required (min 10 characters)'),
});

export type CancelRequestInput = z.infer<typeof CancelRequestSchema>;

// ---------------------------------------------------------------------------
// Deal Skip Milestone Request
// ---------------------------------------------------------------------------

export const SkipMilestoneSchema = z.object({
  milestone_id: z.string().uuid(),
  reason: z.string().min(5, 'Skip reason is required'),
});

export type SkipMilestoneInput = z.infer<typeof SkipMilestoneSchema>;

// ---------------------------------------------------------------------------
// Deal Document Upload
// ---------------------------------------------------------------------------

export const DealDocumentSchema = z.object({
  deal_id: z.string().uuid(),
  category: z.enum(['contracts', 'drawings', 'specs', 'permits', 'invoices', 'correspondence', 'general']).default('general'),
  file_name: z.string().min(1),
  notes: z.string().optional(),
});

export type DealDocumentInput = z.infer<typeof DealDocumentSchema>;
