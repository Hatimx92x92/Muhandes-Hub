'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Gavel } from 'lucide-react';

interface BidInvitation {
  id: string;
  requester_id: string;
  requester_name: string;
  project_id: string;
  project_title: string;
  project_slug: string;
  description_ar: string;
  description_en: string | null;
  status: string;
  created_at: string;
}

interface ReceivedBidInvitationsProps {
  invitations: BidInvitation[];
}

export function ReceivedBidInvitations({ invitations }: ReceivedBidInvitationsProps) {
  const t = useTranslations('dashboard.invitations');

  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={<Gavel className="h-12 w-12" />}
        title={t('noBidInvitations')}
        description={t('noBidInvitationsDesc')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((inv) => (
        <Card key={inv.id} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{inv.project_title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('from')}: {inv.requester_name}
              </p>
            </div>
            <Badge variant={inv.status === 'pending' ? 'secondary' : 'default'}>
              {t(`status_${inv.status}`)}
            </Badge>
          </div>

          {inv.description_ar && (
            <p className="text-sm text-muted-foreground">{inv.description_ar}</p>
          )}

          {inv.status === 'pending' && (
            <div className="pt-2">
              <Link href={`/projects/${inv.project_slug || inv.project_id}/bid`}>
                <Button size="sm">
                  <Gavel className="h-4 w-4" />
                  {t('submitBid')}
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
