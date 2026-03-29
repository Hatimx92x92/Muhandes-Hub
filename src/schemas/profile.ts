import { z } from 'zod/v4';

// =============================================================================
// Profile visibility schema — controls which fields are public
// =============================================================================

export const ProfileVisibilitySchema = z.object({
  phone: z.boolean().optional(),
  website: z.boolean().optional(),
  cr_number: z.boolean().optional(),
  bio: z.boolean().optional(),
  city: z.boolean().optional(),
  company_name: z.boolean().optional(),
  established_year: z.boolean().optional(),
  social_links: z.boolean().optional(),
  specializations: z.boolean().optional(),
  documents: z.boolean().optional(),
});

export type ProfileVisibility = z.infer<typeof ProfileVisibilitySchema>;

// =============================================================================
// Social links schema
// =============================================================================

export const SocialLinksSchema = z.object({
  linkedin: z.url().optional().or(z.literal('')),
  twitter: z.url().optional().or(z.literal('')),
  instagram: z.url().optional().or(z.literal('')),
});

export type SocialLinks = z.infer<typeof SocialLinksSchema>;

// =============================================================================
// Specialization options (predefined set)
// =============================================================================

export const SPECIALIZATION_OPTIONS = [
  'general_contracting',
  'civil_works',
  'electrical',
  'plumbing',
  'hvac',
  'steel_structures',
  'concrete_works',
  'road_construction',
  'landscaping',
  'interior_design',
  'painting',
  'waterproofing',
  'fire_safety',
  'demolition',
  'flooring',
  'glass_aluminum',
  'building_materials',
  'heavy_equipment',
  'safety_equipment',
  'tools_hardware',
  'pipes_fittings',
  'cement_aggregate',
  'wood_timber',
  'insulation',
  'tiles_ceramics',
] as const;

export type Specialization = (typeof SPECIALIZATION_OPTIONS)[number];

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
  vat_number: z.string().optional(),
  website: z.url('Invalid website URL').optional().or(z.literal('')),
  bio_ar: z.string().max(500, 'Bio is too long').optional(),
  bio_en: z.string().max(500, 'Bio is too long').optional(),
  // New fields
  visibility: ProfileVisibilitySchema.optional(),
  social_links: SocialLinksSchema.optional(),
  specializations: z.array(z.enum(SPECIALIZATION_OPTIONS)).optional(),
  established_year: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
});

export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;

// =============================================================================
// Company document schema
// =============================================================================

export const CompanyDocumentSchema = z.object({
  display_name: z.string().min(1, 'Document name is required').max(100, 'Name too long'),
});

export type CompanyDocumentData = z.infer<typeof CompanyDocumentSchema>;
