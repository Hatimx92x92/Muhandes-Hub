// =============================================================================
// Quotation Schemas — Zod v4
// =============================================================================

import { z } from 'zod/v4';

// -- Line Item ----------------------------------------------------------------
export const QuotationLineItemSchema = z.object({
  description: z.string().min(1, 'Line item description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.coerce.number().min(0.01, 'Unit price is required'),
});

export type QuotationLineItem = z.infer<typeof QuotationLineItemSchema>;

// -- Create Quotation ---------------------------------------------------------
export const QuotationSchema = z.object({
  mode: z.enum(['inquiry_response', 'standalone']),
  recipient_id: z.string().uuid().optional(),
  inquiry_id: z.string().uuid().optional(),
  rfq_response_id: z.string().uuid().optional(),
  hire_request_id: z.string().uuid().optional(),
  client_name: z.string().optional(),
  project_ref: z.string().optional(),
  line_items: z.array(QuotationLineItemSchema).min(1, 'At least one line item is required'),
  validity_days: z.coerce.number().int().min(1).default(2),
  payment_terms_ar: z.string().optional(),
  payment_terms_en: z.string().optional(),
  delivery_terms_ar: z.string().optional(),
  delivery_terms_en: z.string().optional(),
  notes_ar: z.string().optional(),
  notes_en: z.string().optional(),
});

export type QuotationInput = z.infer<typeof QuotationSchema>;

// -- Send / Accept / Reject ---------------------------------------------------
export const SendQuotationSchema = z.object({
  quotation_id: z.string().uuid(),
});

export const AcceptQuotationSchema = z.object({
  quotation_id: z.string().uuid(),
});

export const RejectQuotationSchema = z.object({
  quotation_id: z.string().uuid(),
  reason: z.string().optional(),
});
