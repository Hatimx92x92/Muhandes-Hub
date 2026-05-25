// =============================================================================
// Bulk Product Upload Page — Server Wrapper with Role + Tier Guard
// =============================================================================

import { requireRole } from '@/lib/auth-guards';
import { getEffectiveLimits } from '@/types';
import { redirect } from 'next/navigation';
import { BulkUploadClient } from './bulk-upload-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function BulkUploadPage() {
  // Role guard — supplier only
  const { user, supabase } = await requireRole(['supplier']);

  // Tier guard — Business+ only
  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier as string) ?? 'starter';
  const limits = getEffectiveLimits('supplier', tier);

  if (!limits.hasBulkUpload) {
    redirect('/dashboard/products');
  }

  return <BulkUploadClient />;
}
