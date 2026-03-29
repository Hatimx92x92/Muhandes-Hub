import { z } from 'zod/v4';

// =============================================================================
// Contact form schema
// =============================================================================

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.email('Invalid email address'),
  subject: z.string().min(3, 'Subject is required'),
  company: z.string().optional(),
  role_interest: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
