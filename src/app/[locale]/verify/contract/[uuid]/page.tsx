// =============================================================================
// Public Contract Verification Page
// =============================================================================

import { Card } from '@/components/ui/card';
import { verifyContract } from '@/actions/contracts';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function VerifyContractPage({
  params,
}: {
  params: Promise<{ locale: string; uuid: string }>;
}) {
  const { locale, uuid } = await params;
  setRequestLocale(locale);
  const result = await verifyContract(uuid);
  const t = await getTranslations('verify.contract');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <h1 className="text-xl font-bold">{t('title')}</h1>

        {result.error || !result.data?.exists ? (
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-2xl">
              ✕
            </div>
            <p className="text-destructive font-medium">{t('notFound')}</p>
            <p className="text-sm text-muted-foreground">
              {t('notFoundDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-2xl">
              ✓
            </div>
            <p className="text-success font-bold text-lg">{t('verified')}</p>

            <div className="text-start space-y-3 rounded-lg border border-border p-4">
              {!!result.data.signed_at_a && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('partyASignature')}</span>
                  <span className="text-xs">
                    {new Date(result.data.signed_at_a).toLocaleDateString(locale)}
                  </span>
                </div>
              )}
              {!!result.data.signed_at_b && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('partyBSignature')}</span>
                  <span className="text-xs">
                    {new Date(result.data.signed_at_b).toLocaleDateString(locale)}
                  </span>
                </div>
              )}
              {!result.data.signed_at_a && !result.data.signed_at_b && (
                <p className="text-sm text-muted-foreground text-center">{t('notSignedYet')}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {t('verifiedVia')}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
