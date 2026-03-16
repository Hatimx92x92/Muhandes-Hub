'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Mail, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resendVerificationEmail, logout } from '@/actions/auth';

// =============================================================================
// Gate 1: Email Verification Pending
// =============================================================================

export default function EmailSentPage() {
  const router = useRouter();
  const t = useTranslations('verify.emailSent');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setMessage(null);
    const result = await resendVerificationEmail();
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(t('resendSuccess'));
    }
    setResending(false);
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p className="text-sm text-center text-muted-foreground">{message}</p>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={resending}
          loading={resending}
        >
          <RefreshCw className="h-4 w-4" />
          {t('resend')}
        </Button>

        <Button variant="ghost" className="w-full" onClick={handleLogout}>
          {t('logout')}
        </Button>
      </CardContent>
    </Card>
  );
}
