'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { payCommission, disputeCommission } from '@/actions/commissions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/types';

type PayState = ActionResult<{ status: string; paymentUrl?: string }> | null;
type DisputeState = ActionResult<{ disputed: boolean }> | null;

interface CommissionActionsProps {
  commissionId: string;
  canPay: boolean;
  canDispute: boolean;
}

export function CommissionActions({ commissionId, canPay, canDispute }: CommissionActionsProps) {
  const [showDispute, setShowDispute] = useState(false);
  const [payState, payAction, payPending] = useActionState<PayState, FormData>(payCommission, null);
  const [disputeState, disputeAction, disputePending] = useActionState<DisputeState, FormData>(disputeCommission, null);
  const t = useTranslations('features.commissionActions');

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {/* Pay state feedback */}
      {payState?.error && (
        <p className="text-sm text-destructive">{payState.error}</p>
      )}
      {payState?.data && (
        <p className="text-sm text-success">
          {payState.data.paymentUrl ? t('redirectingToPayment') : t('paymentSuccess')}
        </p>
      )}

      {/* Dispute state feedback */}
      {disputeState?.error && (
        <p className="text-sm text-destructive">{disputeState.error}</p>
      )}
      {disputeState?.data && (
        <p className="text-sm text-success">{t('disputeSuccess')}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Pay by card */}
        {canPay && (
          <form action={payAction}>
            <input type="hidden" name="commission_id" value={commissionId} />
            <input type="hidden" name="method" value="card" />
            <Button type="submit" variant="primary" size="sm" loading={payPending}>
              {t('payByCard')}
            </Button>
          </form>
        )}

        {/* Pay by bank transfer */}
        {canPay && (
          <form action={payAction}>
            <input type="hidden" name="commission_id" value={commissionId} />
            <input type="hidden" name="method" value="bank_transfer" />
            <Button type="submit" variant="outline" size="sm" loading={payPending}>
              {t('bankTransfer')}
            </Button>
          </form>
        )}

        {/* Dispute toggle */}
        {canDispute && !showDispute && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDispute(true)}
          >
            {t('dispute')}
          </Button>
        )}
      </div>

      {/* Dispute form */}
      {showDispute && canDispute && (
        <form action={disputeAction} className="space-y-3">
          <input type="hidden" name="commission_id" value={commissionId} />
          <Textarea
            name="reason"
            placeholder={t('disputePlaceholder')}
            rows={3}
            required
            minLength={10}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" size="sm" loading={disputePending}>
              {t('submitDispute')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDispute(false)}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
