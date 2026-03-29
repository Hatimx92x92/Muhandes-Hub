// =============================================================================
// Payment Result Page — Post-Moyasar redirect callback
// =============================================================================

import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string; message?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations('dashboard.subscription.paymentResult');

  const isSuccess = params.status === 'paid';

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      {isSuccess ? (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('successTitle')}</h1>
          <p className="text-muted-foreground mb-8">{t('successDescription')}</p>
          <Link href="/dashboard/subscription">
            <Button variant="primary" size="lg">
              {t('backToSubscription')}
            </Button>
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('failedTitle')}</h1>
          <p className="text-muted-foreground mb-8">
            {params.message || t('failedDescription')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard/subscription">
              <Button variant="outline" size="lg">
                {t('backToSubscription')}
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="primary" size="lg">
                {t('tryAgain')}
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
