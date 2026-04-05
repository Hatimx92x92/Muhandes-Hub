// =============================================================================
// Proof Actions — Confirm / Reject buttons for deal proofs
// =============================================================================

'use client';

import { useState, useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { confirmProof, rejectProof } from '@/actions/deals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle } from 'lucide-react';
import type { ActionResult } from '@/types';

interface ProofActionsProps {
  proofId: string;
}

export function ProofActions({ proofId }: ProofActionsProps) {
  const t = useTranslations('dashboard.deals');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectState, rejectAction, isRejecting] = useActionState(rejectProof, null);

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    const result = await confirmProof(proofId);
    if (result.error) {
      setConfirmError(result.error);
    } else {
      setConfirmSuccess(true);
    }
    setConfirming(false);
  };

  if (confirmSuccess) {
    return (
      <div className="mt-3 rounded-lg bg-success/10 p-2 text-xs text-success">
        {t('proofStatusConfirmed')}
      </div>
    );
  }

  if (rejectState?.data) {
    return (
      <div className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
        {t('proofStatusRejected')}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {confirmError && (
        <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          {confirmError}
        </div>
      )}
      {rejectState?.error && (
        <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          {rejectState.error}
        </div>
      )}

      {!showRejectForm ? (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={confirming}
          >
            <CheckCircle className="h-4 w-4 me-1" />
            {confirming ? '...' : t('confirmProof')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowRejectForm(true)}
          >
            <XCircle className="h-4 w-4 me-1" />
            {t('rejectProof')}
          </Button>
        </div>
      ) : (
        <form action={rejectAction} className="space-y-2">
          <input type="hidden" name="proof_id" value={proofId} />
          <Select name="rejection_reason" required defaultValue="poor_quality">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incomplete_work">Incomplete Work</SelectItem>
              <SelectItem value="poor_quality">Poor Quality</SelectItem>
              <SelectItem value="wrong_scope">Wrong Scope</SelectItem>
              <SelectItem value="missing_documentation">Missing Documentation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            name="rejection_text"
            placeholder={t('rejectionReasonPlaceholder')}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isRejecting}
            >
              {isRejecting ? '...' : t('rejectProof')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRejectForm(false)}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
