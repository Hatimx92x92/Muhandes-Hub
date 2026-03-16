import { CreditCard } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

// =============================================================================
// Gate 2: Payment Pending (Moyasar integration placeholder)
// =============================================================================

export default async function PaymentPage() {
  const t = await getTranslations('verify.payment');

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          {t('placeholder')}
          <br />
          <Link href="/contact" className="text-primary hover:underline">
            {t('contactLink')}
          </Link>
        </div>

        <div className="flex gap-3">
          <form action="/api/auth/signout" method="post" className="flex-1">
            <Button variant="ghost" className="w-full" type="submit">
              {t('logout')}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
