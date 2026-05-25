// =============================================================================
// Dashboard — New Project Page
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ProjectForm } from '@/components/forms/project-form';
import { PageHeader } from '@/components/ui/page-header';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Role check — only project_owner and contractor can post projects
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['project_owner', 'contractor'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const t = await getTranslations('dashboard.projects.newPage');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} backHref="/dashboard/projects" />

      <Card className="p-6">
        <ProjectForm mode="create" />
      </Card>
    </div>
  );
}
