// =============================================================================
// Profile Page — redirects to Settings (profile editing moved there)
// =============================================================================

import { redirect } from 'next/navigation';

export default function ProfilePage() {
  redirect('/dashboard/settings');
}
