'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { shortlistBid, awardBid, rejectBid } from '@/actions/bids';
import { Button } from '@/components/ui/button';
import { Star, Trophy, XCircle } from 'lucide-react';

interface BidActionsProps {
  bidId: string;
  status: 'pending' | 'shortlisted';
}

export function BidActions({ bidId, status }: BidActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('features.bidActions');
  const router = useRouter();

  const handleShortlist = () => {
    setError(null);
    startTransition(async () => {
      const result = await shortlistBid(bidId);
      if (result.error) setError(result.error);
    });
  };

  const handleAward = () => {
    if (!confirm(t('awardConfirm'))) return;
    setError(null);
    startTransition(async () => {
      const result = await awardBid(bidId);
      if (result.error) {
        setError(result.error);
      } else if (result.data?.dealId) {
        router.push(`/dashboard/deals/${result.data.dealId}`);
      } else {
        router.push('/dashboard/deals');
      }
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectBid(bidId);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'pending' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleShortlist}
          disabled={isPending}
        >
          <Star className="me-1.5 h-3.5 w-3.5" />
          {t('shortlist')}
        </Button>
      )}
      <Button
        size="sm"
        variant="primary"
        onClick={handleAward}
        disabled={isPending}
      >
        <Trophy className="me-1.5 h-3.5 w-3.5" />
        {t('award')}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={isPending}
      >
        <XCircle className="me-1.5 h-3.5 w-3.5" />
        {t('reject')}
      </Button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
