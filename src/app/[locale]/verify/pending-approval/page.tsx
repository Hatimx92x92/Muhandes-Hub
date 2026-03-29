import { Clock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

// =============================================================================
// Gate 4: Pending Admin Approval
// =============================================================================

export default async function PendingApprovalPage() {
  const t = await getTranslations('verify.pendingApproval');

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-8 w-8 text-warning" />
        </div>
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          {t('timeline')}
        </div>

        <form action="/api/auth/signout" method="post">
          <Button variant="ghost" className="w-full" type="submit">
            {t('logout')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
