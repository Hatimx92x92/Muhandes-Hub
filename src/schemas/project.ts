// =============================================================================
// Muhandes HUB — Project Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Create Project Schema
// ---------------------------------------------------------------------------
export const ProjectSchema = z.object({
  title_ar: z.string().max(200).optional(),
  title_en: z.string().max(200).optional(),
  description_ar: z.string().max(5000).optional(),
  description_en: z.string().max(5000).optional(),
  category_id: z.string().uuid('Please select a valid category').optional(),
  city: z.string().min(1, 'Please select a city'),
  budget_min: z.coerce.number().min(0, 'Minimum budget must be 0 or more').optional(),
  budget_max: z.coerce.number().min(0, 'Maximum budget must be 0 or more').optional(),
  timeline_start: z.string().optional(),
  timeline_end: z.string().optional(),
  classification: z.enum(['a', 'b', 'c']).optional(),
  source: z.enum(['owner', 'subcontract']).default('owner'),
  external_link: z.string().url().max(500).optional().or(z.literal('')),
}).refine(
  (data) => {
    const ar = data.title_ar?.trim();
    const en = data.title_en?.trim();
    return (!!ar && ar.length >= 5) || (!!en && en.length >= 5);
  },
  { message: 'At least one language is required for title (min 5 characters)', path: ['title_ar'] },
).refine(
  (data) => {
    const ar = data.description_ar?.trim();
    const en = data.description_en?.trim();
    return (!!ar && ar.length >= 20) || (!!en && en.length >= 20);
  },
  { message: 'At least one language is required for description (min 20 characters)', path: ['description_ar'] },
).refine(
  (data) => {
    if (data.budget_min != null && data.budget_max != null) {
      return data.budget_max >= data.budget_min;
    }
    return true;
  },
  { message: 'Maximum must be greater than or equal to minimum', path: ['budget_max'] },
).refine(
  (data) => {
    if (data.timeline_start && data.timeline_end) {
      return new Date(data.timeline_end) >= new Date(data.timeline_start);
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['timeline_end'] },
);

export type ProjectInput = z.infer<typeof ProjectSchema>;

// ---------------------------------------------------------------------------
// Update Project Schema (same fields + id)
// ---------------------------------------------------------------------------
export const UpdateProjectSchema = ProjectSchema.and(
  z.object({ project_id: z.string().uuid() }),
);

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// ---------------------------------------------------------------------------
// Submit for Approval
// ---------------------------------------------------------------------------
export const SubmitProjectForApprovalSchema = z.object({
  project_id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Delete Project
// ---------------------------------------------------------------------------
export const DeleteProjectSchema = z.object({
  project_id: z.string().uuid(),
});
