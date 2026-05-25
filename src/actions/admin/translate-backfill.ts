// =============================================================================
// Muhandes HUB — Entity Translation Backfill
// Called after rendering entity detail pages when a locale field is missing.
// Uses the admin client to persist the translation without RLS restrictions.
// =============================================================================

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { autoTranslateBilingualFields } from '@/lib/translate';

type EntityTable = 'products' | 'projects' | 'rfqs' | 'rfq_responses' | 'bids';

export async function backfillEntityTranslation(
  table: EntityTable,
  id: string,
  entity: Record<string, unknown>,
  fields: string[],
): Promise<void> {
  try {
    const translated = await autoTranslateBilingualFields(entity, fields);

    const patch: Record<string, unknown> = {};
    for (const f of fields) {
      if (!entity[`${f}_ar`] && translated[`${f}_ar`]) {
        patch[`${f}_ar`] = translated[`${f}_ar`];
      }
      if (!entity[`${f}_en`] && translated[`${f}_en`]) {
        patch[`${f}_en`] = translated[`${f}_en`];
      }
    }

    if (Object.keys(patch).length === 0) return;

    const supabase = createAdminClient();
    await supabase.from(table).update(patch).eq('id', id);
  } catch {
    // Non-critical: translation backfill failure should not surface to users
  }
}
