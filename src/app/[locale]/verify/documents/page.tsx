import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { setRequestLocale } from 'next-intl/server';
import { getLocaleField } from '@/lib/utils';
import { DocumentUploadForm } from '@/components/features/verify/document-upload-form';

// =============================================================================
// Gate 3: Document Upload — Server wrapper that fetches rejection data
// =============================================================================

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check for previously rejected documents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: rejectedDocs } = await db
    .from('verification_documents')
    .select('admin_notes_ar, admin_notes_en, reviewed_at')
    .eq('user_id', user.id)
    .eq('status', 'rejected')
    .order('reviewed_at', { ascending: false })
    .limit(1);

  const rejection =
    rejectedDocs && rejectedDocs.length > 0
      ? {
          reason:
            getLocaleField(rejectedDocs[0], 'admin_notes', locale) ||
            '',
        }
      : null;

  return <DocumentUploadForm rejection={rejection} />;
}
