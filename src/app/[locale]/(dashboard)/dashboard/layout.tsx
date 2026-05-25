import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav';
import { Toaster } from '@/components/ui/sonner';
import { RealtimeProvider } from '@/components/features/realtime-provider';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb-provider';
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav';
import { CommandSearch } from '@/components/features/command-search';
import { getUnreadNotificationCount, getUnreadMessageCount } from '@/actions/notifications';
import { getPlatformAnnouncement } from '@/actions/admin/settings';
import { AnnouncementBanner } from '@/components/features/announcement-banner';
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

  // Fetch unread counts + platform announcement in parallel
  const [notificationCount, messageCount, announcement] = await Promise.all([
    getUnreadNotificationCount(),
    getUnreadMessageCount(),
    getPlatformAnnouncement(),
  ]);

  return (
    <RealtimeProvider
      userId={user.id}
      initialNotificationCount={notificationCount}
      initialMessageCount={messageCount}
    >
      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile, shown md+ */}
        <div className="hidden md:block">
          <Sidebar userRole={userRole} profileSlug={profileSlug} />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col">
          {/* Platform announcement banner */}
          {announcement && (
            <AnnouncementBanner
              message_ar={announcement.message_ar}
              message_en={announcement.message_en}
            />
          )}

          {/* Mobile topbar — hamburger + title, hidden on md+ */}
          <div className="md:hidden sticky top-16 z-30 flex items-center gap-3 border-b border-border bg-background px-4 py-2">
            <DashboardMobileNav userRole={userRole} profileSlug={profileSlug} />
          </div>

          <BreadcrumbProvider>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <BreadcrumbNav rootType="dashboard" />
                <CommandSearch isAdmin={profile?.is_admin} />
              </div>
              {children}
            </main>
          </BreadcrumbProvider>
        </div>
      </div>
      <Toaster position="bottom-left" dir="auto" richColors />
    </RealtimeProvider>
  );
}
