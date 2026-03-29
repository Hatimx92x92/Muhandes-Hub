// =============================================================================
// Muhandes HUB — Auth Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Reusable field schemas
// ---------------------------------------------------------------------------

const emailField = z.email('Invalid email address');

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must not exceed 72 characters');

/** Phone: 9 digits after +966 prefix (prefix is added automatically) */
const phoneField = z
  .string()
  .regex(/^[0-9]{9}$/, 'Phone number must be 9 digits after +966');

// ---------------------------------------------------------------------------
// Login Schema
// ---------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ---------------------------------------------------------------------------
// Reset Password Schema
// ---------------------------------------------------------------------------

export const ResetPasswordSchema = z.object({
  email: emailField,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ---------------------------------------------------------------------------
// Update Password Schema
// ---------------------------------------------------------------------------

export const UpdatePasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

// ---------------------------------------------------------------------------
// Register Schema — multi-step wizard validation
// ---------------------------------------------------------------------------

/** Step 1: Role selection */
export const RegisterStep1Schema = z.object({
  role: z.enum(['project_owner', 'contractor', 'supplier', 'buyer'], {
    error: 'Please select a role',
  }),
});
export type RegisterStep1Input = z.infer<typeof RegisterStep1Schema>;

/** Step 2: Account details */
export const RegisterStep2Schema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: emailField,
  password: passwordField,
  phone: phoneField,
  pdpl_consent: z.literal(true, {
    error: 'You must agree to the privacy policy and terms of use',
  }),
});
export type RegisterStep2Input = z.infer<typeof RegisterStep2Schema>;

/** Step 3: Profile & company details */
export const RegisterStep3Schema = z
  .object({
    profile_type: z.enum(['company', 'personal']),
    company_name_ar: z.string().optional(),
    company_name_en: z.string().optional(),
    cr_number: z.string().optional(),
    website: z.union([z.url(), z.literal('')]).optional(),
    city: z.string().min(1, 'City is required'),
  })
  .superRefine((data, ctx) => {
    if (data.profile_type === 'company') {
      if (!data.company_name_ar || data.company_name_ar.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Company name in Arabic is required',
          path: ['company_name_ar'],
        });
      }
      if (!data.company_name_en || data.company_name_en.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Company name in English is required',
          path: ['company_name_en'],
        });
      }
      if (!data.cr_number || data.cr_number.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Commercial registration number is required',
          path: ['cr_number'],
        });
      }
    }
  });
export type RegisterStep3Input = z.infer<typeof RegisterStep3Schema>;

/** Step 4: Subscription tier (Contractor/Supplier only) */
export const RegisterStep4Schema = z.object({
  tier: z.enum(['starter', 'pro', 'business', 'enterprise']),
  duration_months: z.enum(['1', '3', '6', '12']).transform(Number),
  coupon_code: z.string().optional(),
  payment_method: z.enum(['card', 'bank_transfer']).optional(),
});
export type RegisterStep4Input = z.infer<typeof RegisterStep4Schema>;

// ---------------------------------------------------------------------------
// Full registration payload — sent to server action
// ---------------------------------------------------------------------------

export const RegisterSchema = z.object({
  // Step 1
  role: z.enum(['project_owner', 'contractor', 'supplier', 'buyer']),
  // Step 2
  full_name: z.string().min(2).max(100),
  email: emailField,
  password: passwordField,
  phone: phoneField,
  pdpl_consent: z.literal(true),
  // Step 3
  profile_type: z.enum(['company', 'personal']),
  company_name_ar: z.string().optional(),
  company_name_en: z.string().optional(),
  cr_number: z.string().optional(),
  website: z.union([z.url(), z.literal('')]).optional(),
  city: z.string().min(1),
  // Step 4 (optional — PO/Buyer skip)
  tier: z.enum(['starter', 'pro', 'business', 'enterprise']).optional(),
  duration_months: z.number().optional(),
  coupon_code: z.string().optional(),
  payment_method: z.enum(['card', 'bank_transfer']).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ---------------------------------------------------------------------------
// Google OAuth registration — completes profile after OAuth sign-in
// ---------------------------------------------------------------------------

export const GoogleRegisterSchema = z.object({
  role: z.enum(['project_owner', 'contractor', 'supplier', 'buyer']),
  phone: phoneField,
  profile_type: z.enum(['company', 'personal']),
  company_name_ar: z.string().optional(),
  company_name_en: z.string().optional(),
  cr_number: z.string().optional(),
  website: z.union([z.url(), z.literal('')]).optional(),
  city: z.string().min(1),
  tier: z.enum(['starter', 'pro', 'business', 'enterprise']).optional(),
  duration_months: z.number().optional(),
  coupon_code: z.string().optional(),
  payment_method: z.enum(['card', 'bank_transfer']).optional(),
});
export type GoogleRegisterInput = z.infer<typeof GoogleRegisterSchema>;
