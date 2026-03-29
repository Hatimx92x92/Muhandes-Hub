// =============================================================================
// Deal Action Components — Confirm/Reject Proof, Cancel Request, etc.
// =============================================================================

'use client';

import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  confirmProof,
  approveCancellation,
  rejectCancellation,
  approveMilestoneSuggestion,
  rejectMilestoneSuggestion,
  approveSkipMilestone,
  rejectSkipMilestone,
} from '@/actions/deals';

// ---------------------------------------------------------------------------
// Confirm Proof Button
// ---------------------------------------------------------------------------
export function ConfirmProofButton({ proofId }: { proofId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('features.dealActions');

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmProof(proofId);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        if (result.data?.dealCompleted) {
          // Refresh to show completed state
        }
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="primary"
        size="sm"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? t('confirming') : t('confirmProof')}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approve Cancellation Button
// ---------------------------------------------------------------------------
export function ApproveCancellationButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('features.dealActions');

  function handleApprove() {
    if (!confirm(t('approveCancelConfirm'))) return;
    startTransition(async () => {
      const result = await approveCancellation(requestId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? t('approving') : t('approveCancel')}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject Cancellation Button
// ---------------------------------------------------------------------------
export function RejectCancellationButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('features.dealActions');

  function handleReject() {
    startTransition(async () => {
      const result = await rejectCancellation(requestId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? t('rejecting') : t('rejectCancel')}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approve Milestone Suggestion Button
// ---------------------------------------------------------------------------
export function ApproveSuggestionButton({ suggestionId }: { suggestionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('features.dealActions');

  function handleApprove() {
    startTransition(async () => {
      const result = await approveMilestoneSuggestion(suggestionId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="primary"
        size="sm"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? t('approving') : t('acceptSuggestion')}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject Milestone Suggestion Button
// ---------------------------------------------------------------------------
export function RejectSuggestionButton({ suggestionId }: { suggestionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('features.dealActions');

  function handleReject() {
    startTransition(async () => {
      const result = await rejectMilestoneSuggestion(suggestionId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? t('rejecting') : t('rejectSuggestion')}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approve Skip Milestone Button
// ---------------------------------------------------------------------------
export function ApproveSkipButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('features.dealActions');

  function handleApprove() {
    startTransition(async () => {
      const result = await approveSkipMilestone(requestId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? t('approving') : t('approveSkip')}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject Skip Milestone Button
// ---------------------------------------------------------------------------
export function RejectSkipButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('features.dealActions');

  function handleReject() {
    startTransition(async () => {
      const result = await rejectSkipMilestone(requestId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? t('rejecting') : t('rejectSkip')}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
