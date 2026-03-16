// =============================================================================
// Muqawil HUB — Project Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Create Project Schema
// ---------------------------------------------------------------------------
export const ProjectSchema = z.object({
  title_ar: z.string().min(5, 'Arabic title required (min 5 characters)').max(200),
  title_en: z.string().min(5, 'English title required (min 5 chars)').max(200),
  description_ar: z.string().min(20, 'Arabic description required (min 20 characters)').max(5000),
  description_en: z.string().min(20, 'English description required (min 20 chars)').max(5000),
  category_id: z.string().uuid('Please select a valid category').optional(),
  city: z.string().min(1, 'Please select a city'),
  budget_min: z.coerce.number().min(0, 'Minimum budget must be 0 or more').optional(),
  budget_max: z.coerce.number().min(0, 'Maximum budget must be 0 or more').optional(),
  timeline_start: z.string().optional(),
  timeline_end: z.string().optional(),
  classification: z.enum(['a', 'b', 'c']).optional(),
  source: z.enum(['owner', 'subcontract']).default('owner'),
}).refine(
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
