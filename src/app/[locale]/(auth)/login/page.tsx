import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginForm } from '@/components/forms/login-form';
import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// Login Page — email/password + Google OAuth
// =============================================================================

export default async function LoginPage() {
  const t = await getTranslations('auth.login');

  return (
    <Card className="shadow-xl border-border/60">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-extrabold">{t('title')}</CardTitle>
        <CardDescription className="mt-1">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
