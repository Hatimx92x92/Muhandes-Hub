// =============================================================================
// Quotation Actions — client-side send/accept/reject buttons
// =============================================================================

'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { sendQuotation, acceptQuotation, rejectQuotation, duplicateQuotation } from '@/actions/quotations';
import { Send, Check, X, Copy } from 'lucide-react';

// ---------------------------------------------------------------------------
// Send Button (for quotation owner, draft → sent)
// ---------------------------------------------------------------------------
export function SendQuotationButton({ quotationId }: { quotationId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.quotationActions');

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendQuotation(quotationId);
      if (!result.error) {
        router.refresh();
      }
    });
  };

  return (
    <Button onClick={handleSend} disabled={isPending}>
      <Send className="h-4 w-4 me-1" />
      {isPending ? t('sending') : t('sendQuotation')}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Accept Button (for recipient, sent → accepted)
// ---------------------------------------------------------------------------
export function AcceptQuotationButton({ quotationId }: { quotationId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.quotationActions');
  const handleAccept = () => {
    if (!confirm(t('acceptConfirm'))) return;
    startTransition(async () => {
      const result = await acceptQuotation(quotationId);
      if (result.data) {
        router.push(`/dashboard/deals/${result.data.dealId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Button onClick={handleAccept} disabled={isPending} variant="primary">
      <Check className="h-4 w-4 me-1" />
      {isPending ? t('accepting') : t('acceptQuotation')}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Reject Button (for recipient, sent → rejected)
// ---------------------------------------------------------------------------
export function RejectQuotationButton({ quotationId }: { quotationId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.quotationActions');
  const handleReject = () => {
    const reason = prompt(t('rejectPrompt'));
    startTransition(async () => {
      const result = await rejectQuotation(quotationId, reason ?? undefined);
      if (!result.error) {
        router.refresh();
      }
    });
  };

  return (
    <Button onClick={handleReject} disabled={isPending} variant="destructive">
      <X className="h-4 w-4 me-1" />
      {isPending ? t('rejecting') : t('reject')}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Duplicate Button (for sender — creates a draft copy)
// ---------------------------------------------------------------------------
export function DuplicateQuotationButton({ quotationId }: { quotationId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.quotationActions');

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateQuotation(quotationId);
      if (result.data) {
        router.push(`/dashboard/quotations/${result.data.id}`);
      }
    });
  };

  return (
    <Button onClick={handleDuplicate} disabled={isPending} variant="outline" size="sm">
      <Copy className="h-4 w-4 me-1" />
      {isPending ? t('duplicating') : t('duplicate')}
    </Button>
  );
}
