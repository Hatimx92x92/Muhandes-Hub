import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RegisterWizard } from '@/components/forms/register-wizard';
import { Link } from '@/i18n/navigation';
import { GoogleAuthButton } from '@/components/features/google-auth-button';

// =============================================================================
// Register Page — multi-step wizard host
// =============================================================================

interface Props {
  searchParams: Promise<{ oauth?: string; email?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const t = await getTranslations('auth.register');
  const params = await searchParams;
  const isOAuthMode = params.oauth === 'google';
  const oauthEmail = params.email ?? '';

  return (
    <Card className="max-w-lg mx-auto shadow-xl border-border/60">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-extrabold">{t('title')}</CardTitle>
        <CardDescription className="mt-1">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterWizard isOAuthMode={isOAuthMode} oauthEmail={oauthEmail} />

        {!isOAuthMode && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
              </div>
            </div>
            <GoogleAuthButton />
          </>
        )}

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
