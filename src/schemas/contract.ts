// =============================================================================
// Muhandes HUB — Contract Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Party Info (embedded JSON in contract)
// ---------------------------------------------------------------------------
const PartyInfoSchema = z.object({
  name: z.string().default(''),
  company_name_ar: z.string().optional(),
  company_name_en: z.string().optional(),
  cr_number: z.string().optional(),
  vat_number: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.email(), z.literal('')]).optional(),
});

// ---------------------------------------------------------------------------
// Create Contract
// ---------------------------------------------------------------------------
export const ContractSchema = z.object({
  deal_id: z.string().uuid().optional(),
  template_type: z.enum(['construction_agreement', 'supply_agreement', 'custom']),
  party_a: PartyInfoSchema,
  party_b: PartyInfoSchema,
  scope_ar: z.string().min(10).optional(),
  scope_en: z.string().optional(),
  payment_terms_ar: z.string().optional(),
  payment_terms_en: z.string().optional(),
  timeline: z.string().optional(),
  penalties_ar: z.string().optional(),
  penalties_en: z.string().optional(),
  warranty_ar: z.string().optional(),
  warranty_en: z.string().optional(),
  governing_law: z.string().default('Saudi Arabian Law'),
  additional_clauses: z.array(z.object({
    title_ar: z.string(),
    title_en: z.string().optional(),
    content_ar: z.string(),
    content_en: z.string().optional(),
  })).default([]),
});

// ---------------------------------------------------------------------------
// Sign Contract
// ---------------------------------------------------------------------------
export const SignContractSchema = z.object({
  contract_id: z.string().uuid(),
  signatory_name: z.string().min(2),
  signatory_title: z.string().min(2),
});

// ---------------------------------------------------------------------------
// Clause Library
// ---------------------------------------------------------------------------
export const ClauseSchema = z.object({
  title_ar: z.string().min(3),
  title_en: z.string().min(3),
  content_ar: z.string().min(10),
  content_en: z.string().min(10),
  category: z.enum(['warranty', 'penalty', 'payment', 'delivery', 'general']),
});

export type ContractInput = z.infer<typeof ContractSchema>;
export type SignContractInput = z.infer<typeof SignContractSchema>;
export type ClauseInput = z.infer<typeof ClauseSchema>;
