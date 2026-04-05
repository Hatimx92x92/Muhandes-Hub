// =============================================================================
// Muhandes HUB — Saved Filters Schemas
// =============================================================================

import { z } from 'zod/v4';

export const SaveFilterSchema = z.object({
  name: z.string().min(1).max(100),
  page: z.enum(['projects', 'marketplace', 'rfqs', 'partners']),
  filters: z.record(z.string(), z.string()),
});

export type SaveFilterData = z.infer<typeof SaveFilterSchema>;

export const DeleteFilterSchema = z.object({
  id: z.string().uuid(),
});
