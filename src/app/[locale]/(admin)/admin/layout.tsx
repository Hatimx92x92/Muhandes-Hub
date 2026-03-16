import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import {
  LayoutDashboard,
  Users,
  FileText,
  Handshake,
  Banknote,
  CreditCard,
  Star,
  Settings,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const adminNav = [
  { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'users', icon: Users },
  { href: '/admin/posts', labelKey: 'posts', icon: FileText },
  { href: '/admin/deals', labelKey: 'deals', icon: Handshake },
  { href: '/admin/commissions', labelKey: 'commissions', icon: Banknote },
  { href: '/admin/subscriptions', labelKey: 'subscriptions', icon: CreditCard },
  { href: '/admin/reviews', labelKey: 'reviews', icon: Star },
  { href: '/admin/settings', labelKey: 'settings', icon: Settings },
  { href: '/admin/audit-log', labelKey: 'auditLog', icon: ClipboardList },
];

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
    .select('is_admin, full_name_ar, full_name_en')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <aside className="hidden w-64 shrink-0 border-e border-border bg-card lg:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin" className="text-lg font-bold text-primary">
            {t('adminPanel')}
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-4">
          <p className="truncate text-sm font-medium">
            {profile.full_name_ar ?? profile.full_name_en ?? t('admin')}
          </p>
          <Link
            href="/dashboard"
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>{t('backToDashboard')}</span>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile admin header */}
        <header className="flex h-14 items-center border-b border-border bg-card px-4 lg:hidden">
          <Link href="/admin" className="text-lg font-bold text-primary">
            {t('adminPanel')}
          </Link>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
