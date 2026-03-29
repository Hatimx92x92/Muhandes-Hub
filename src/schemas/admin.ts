import { z } from 'zod/v4';

// =============================================================================
// Admin — Profile Update Schema (partial, all fields optional)
// =============================================================================

export const AdminUpdateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().regex(/^[0-9]{9}$/, 'Phone must be 9 digits').optional(),
  profile_type: z.enum(['company', 'personal']).optional(),
  company_name_ar: z.string().optional(),
  company_name_en: z.string().optional(),
  cr_number: z.string().optional(),
  vat_number: z.string().optional(),
  website: z.union([z.url(), z.literal('')]).optional(),
  bio_ar: z.string().max(500).optional(),
  bio_en: z.string().max(500).optional(),
  address_ar: z.string().optional(),
  address_en: z.string().optional(),
  city_id: z.string().uuid().optional().nullable(),
  verification_status: z.enum([
    'pending_email',
    'pending_payment',
    'pending_documents',
    'pending_approval',
    'active',
    'restricted',
    'banned',
  ]).optional(),
});

export type AdminUpdateProfileData = z.infer<typeof AdminUpdateProfileSchema>;

// =============================================================================
// Admin — Auth Update Schema
// =============================================================================

export const AdminUpdateAuthSchema = z.object({
  email: z.email().optional(),
  phone: z.string().optional(),
  email_confirm: z.boolean().optional(),
});

export type AdminUpdateAuthData = z.infer<typeof AdminUpdateAuthSchema>;
