import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { NotificationListener } from '@/components/features/notifications/notification-listener';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb-provider';
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav';
import { getUnreadNotificationCount, getUnreadMessageCount } from '@/actions/notifications';
import { getLocale } from 'next-intl/server';
import { getEntitySlug } from '@/lib/utils';
import type { UserRole } from '@/types';

// =============================================================================
// (dashboard) Layout — Sidebar + Topbar for authenticated users
// =============================================================================

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile for sidebar role + topbar name
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (f: string, v: string) => {
          single: () => Promise<{
            data: { role: string; full_name: string; avatar_url: string | null; is_admin: boolean; slug_ar: string | null; slug_en: string | null } | null;
          }>;
        };
      };
    };
  };

  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, avatar_url, is_admin, slug_ar, slug_en')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role as UserRole) || undefined;
  const locale = await getLocale();
  const profileSlug = profile ? getEntitySlug(profile, locale) : null;

  // Fetch unread counts for sidebar badges
  const [notificationCount, messageCount] = await Promise.all([
    getUnreadNotificationCount(),
    getUnreadMessageCount(),
  ]);

  return (
    <>
      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile, shown md+ */}
        <div className="hidden md:block">
          <Sidebar userRole={userRole} profileSlug={profileSlug} messageCount={messageCount} notificationCount={notificationCount} />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col">
          <BreadcrumbProvider>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <BreadcrumbNav rootType="dashboard" className="mb-6" />
              {children}
            </main>
          </BreadcrumbProvider>
        </div>

        {/* Realtime notification listener */}
        <NotificationListener userId={user.id} />
      </div>
      <Toaster position="bottom-left" dir="auto" richColors />
    </>
  );
}
