'use client';

import { useState, useTransition } from 'react';
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
      if (result.error) setError(result.error);
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
    <div className="flex items-center gap-1">
      {status === 'pending' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleShortlist}
          disabled={isPending}
          title={t('shortlist')}
        >
          <Star className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        size="sm"
        variant="primary"
        onClick={handleAward}
        disabled={isPending}
        title={t('award')}
      >
        <Trophy className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={isPending}
        title={t('reject')}
      >
        <XCircle className="h-3.5 w-3.5" />
      </Button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
