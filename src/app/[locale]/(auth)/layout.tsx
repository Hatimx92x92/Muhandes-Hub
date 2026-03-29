// =============================================================================
// (auth) Layout — Centered card for login/register/forgot-password
// =============================================================================

import { Logo } from '@/components/ui/logo';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('common');
  return (
    <div className="relative flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      {/* Subtle decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      {/* Gradient accent at top */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center group">
            <Logo size="lg" subtitle={t('appTagline')} />
          </Link>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
