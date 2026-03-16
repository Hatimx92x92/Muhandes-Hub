// =============================================================================
// RFQ Actions — client components for submit/accept/reject
// =============================================================================

'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { submitRFQForApproval, acceptRFQResponse, rejectRFQResponse } from '@/actions/rfqs';
import { Send, Check, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Submit RFQ for admin approval
// ---------------------------------------------------------------------------
export function SubmitRFQButton({ rfqId }: { rfqId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.rfqActions');

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitRFQForApproval(rfqId);
      if (!result.error) {
        router.refresh();
      }
    });
  };

  return (
    <Button onClick={handleSubmit} disabled={isPending}>
      <Send className="h-4 w-4 me-1" />
      {isPending ? t('sending') : t('submitForReview')}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Accept RFQ Response (poster)
// ---------------------------------------------------------------------------
export function AcceptRFQResponseButton({ responseId }: { responseId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.rfqActions');
  const handleAccept = () => {
    if (!confirm(t('acceptConfirm'))) return;
    startTransition(async () => {
      const result = await acceptRFQResponse(responseId);
      if (result.data) {
        router.push(`/dashboard/deals/${result.data.dealId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Button onClick={handleAccept} disabled={isPending} variant="primary" size="sm">
      <Check className="h-3.5 w-3.5 me-1" />
      {isPending ? t('accepting') : t('accept')}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Reject RFQ Response (poster)
// ---------------------------------------------------------------------------
export function RejectRFQResponseButton({ responseId }: { responseId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.rfqActions');

  const handleReject = () => {
    startTransition(async () => {
      await rejectRFQResponse(responseId);
      router.refresh();
    });
  };

  return (
    <Button onClick={handleReject} disabled={isPending} variant="destructive" size="sm">
      <X className="h-3.5 w-3.5 me-1" />
      {isPending ? t('rejecting') : t('reject')}
    </Button>
  );
}
