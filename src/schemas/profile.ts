import { z } from 'zod/v4';

// =============================================================================
// Profile update schema
// =============================================================================

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[0-9]{9}$/, 'Phone number must be 9 digits').optional(),
  profile_type: z.enum(['company', 'personal']),
  company_name_ar: z.string().optional(),
  company_name_en: z.string().optional(),
  city: z.string().optional(),
  cr_number: z.string().optional(),
  website: z.url('Invalid website URL').optional().or(z.literal('')),
  bio_ar: z.string().max(500, 'Bio is too long').optional(),
  bio_en: z.string().max(500, 'Bio is too long').optional(),
});

export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
