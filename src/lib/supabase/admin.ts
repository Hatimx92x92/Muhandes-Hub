// =============================================================================
// Muhandes HUB — Supabase Admin Client (Service Role — server actions ONLY)
// =============================================================================
// ⚠️ NEVER import this file from client components or outside src/actions/admin/
// This bypasses RLS and has full database access.
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
