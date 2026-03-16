import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RegisterWizard } from '@/components/forms/register-wizard';
import { Link } from '@/i18n/navigation';

// =============================================================================
// Register Page — multi-step wizard host
// =============================================================================

export default async function RegisterPage() {
  const t = await getTranslations('auth.register');

  return (
    <Card className="max-w-lg mx-auto shadow-xl border-border/60">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-extrabold">{t('title')}</CardTitle>
        <CardDescription className="mt-1">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterWizard />

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            {t('login')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
