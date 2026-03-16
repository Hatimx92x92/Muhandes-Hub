'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toggleReviewVisibility } from '@/actions/admin/moderation';
import { Button } from '@/components/ui/button';

interface AdminReviewActionsProps {
  reviewId: string;
  isHidden: boolean;
}

export function AdminReviewActions({ reviewId, isHidden }: AdminReviewActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.adminReview');

  const handleToggle = () => {
    startTransition(async () => {
      await toggleReviewVisibility(reviewId, !isHidden);
      router.refresh();
    });
  };

  return (
    <Button
      size="sm"
      variant={isHidden ? 'outline' : 'destructive'}
      loading={isPending}
      onClick={handleToggle}
    >
      {isHidden ? t('show') : t('hide')}
    </Button>
  );
}
