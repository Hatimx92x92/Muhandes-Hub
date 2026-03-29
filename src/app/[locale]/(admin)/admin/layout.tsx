import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb-provider';
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('admin.nav');

  // Auth + is_admin guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="flex flex-1">
      <AdminSidebar adminName={profile.full_name ?? t('admin')} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <BreadcrumbProvider>
          <div className="p-6">
            <BreadcrumbNav rootType="admin" className="mb-6" />
            {children}
          </div>
        </BreadcrumbProvider>
      </main>
    </div>
  );
}
