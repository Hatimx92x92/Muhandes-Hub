// =============================================================================
// Muhandes HUB — Saved Filters Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { SaveFilterSchema, DeleteFilterSchema } from '@/schemas/filters';
import type { ActionResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedFilter {
  id: string;
  name: string;
  page: string;
  filters: Record<string, string>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// SAVE FILTER
// ---------------------------------------------------------------------------
export async function saveFilter(input: {
  name: string;
  page: string;
  filters: Record<string, string>;
}): Promise<ActionResult<SavedFilter>> {
  const t = await getTranslations('actions.filters');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const parsed = SaveFilterSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: t('invalidInput') };

  const { data: filter, error } = await db(supabase)
    .from('saved_filters')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      page: parsed.data.page,
      filters: parsed.data.filters,
    })
    .select()
    .single();

  if (error) return { data: null, error: t('saveError') };

  revalidatePath(`/${parsed.data.page}`);
  return { data: filter as SavedFilter, error: null };
}

// ---------------------------------------------------------------------------
// GET SAVED FILTERS
// ---------------------------------------------------------------------------
export async function getSavedFilters(
  page: string,
): Promise<ActionResult<SavedFilter[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null }; // Return empty for anonymous

  const { data, error } = await db(supabase)
    .from('saved_filters')
    .select('id, name, page, filters, created_at')
    .eq('user_id', user.id)
    .eq('page', page)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: null };

  return { data: (data ?? []) as SavedFilter[], error: null };
}

// ---------------------------------------------------------------------------
// DELETE SAVED FILTER
// ---------------------------------------------------------------------------
export async function deleteSavedFilter(
  id: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.filters');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const parsed = DeleteFilterSchema.safeParse({ id });
  if (!parsed.success) return { data: null, error: t('invalidInput') };

  const { error } = await db(supabase)
    .from('saved_filters')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id);

  if (error) return { data: null, error: t('deleteError') };

  return { data: { deleted: true }, error: null };
}
