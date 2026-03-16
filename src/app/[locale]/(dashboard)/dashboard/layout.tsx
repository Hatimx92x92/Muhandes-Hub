import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { ToastProvider } from '@/components/ui/toast';
import { NotificationListener } from '@/components/features/notifications/notification-listener';
import { getUnreadNotificationCount, getUnreadMessageCount } from '@/actions/notifications';
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
            data: { role: string; full_name: string; avatar_url: string | null } | null;
          }>;
        };
      };
    };
  };

  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role as UserRole) || undefined;
  const userName = profile?.full_name || user.email || '';
  const userAvatar = profile?.avatar_url || undefined;

  // Fetch unread counts for topbar and sidebar badges
  const [notificationCount, messageCount] = await Promise.all([
    getUnreadNotificationCount(),
    getUnreadMessageCount(),
  ]);

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        {/* Sidebar - hidden on mobile, shown md+ */}
        <div className="hidden md:block">
          <Sidebar userRole={userRole} messageCount={messageCount} notificationCount={notificationCount} />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col">
          <Topbar userName={userName} userAvatar={userAvatar} notificationCount={notificationCount} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        {/* Realtime notification listener */}
        <NotificationListener userId={user.id} />
      </div>
    </ToastProvider>
  );
}
