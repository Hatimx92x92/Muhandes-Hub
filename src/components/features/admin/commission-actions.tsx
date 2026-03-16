'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { approveCommissionPayment, resolveCommissionDispute } from '@/actions/admin/commissions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface AdminCommissionActionsProps {
  commissionId: string;
  currentStatus: string;
}

export function AdminCommissionActions({ commissionId, currentStatus }: AdminCommissionActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState('');
  const router = useRouter();
  const t = useTranslations('features.adminCommission');

  const handleApprovePayment = () => {
    startTransition(async () => {
      await approveCommissionPayment(commissionId);
      router.refresh();
    });
  };

  const handleResolveDispute = () => {
    if (!resolution.trim()) return;
    startTransition(async () => {
      const amount = adjustedAmount ? Number(adjustedAmount) : undefined;
      await resolveCommissionDispute(commissionId, resolution.trim(), amount);
      router.refresh();
      setShowResolve(false);
    });
  };

  return (
    <div className="space-y-2">
      {/* Approve payment button — for pending or approved */}
      {(currentStatus === 'pending' || currentStatus === 'approved') && (
        <Button
          size="sm"
          variant="primary"
          loading={isPending}
          onClick={handleApprovePayment}
        >
          {t('approvePayment')}
        </Button>
      )}

      {/* Resolve dispute — for disputed */}
      {currentStatus === 'disputed' && (
        <>
          {!showResolve ? (
            <Button
              size="sm"
              variant="outline"
              loading={isPending}
              onClick={() => setShowResolve(true)}
            >
              {t('resolveDispute')}
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Textarea
                placeholder={t('resolutionPlaceholder')}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={2}
              />
              <Input
                type="number"
                placeholder={t('adjustedAmountPlaceholder')}
                value={adjustedAmount}
                onChange={(e) => setAdjustedAmount(e.target.value)}
                min={0}
                step={0.01}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  loading={isPending}
                  onClick={handleResolveDispute}
                  disabled={!resolution.trim()}
                >
                  {t('confirmResolution')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowResolve(false)}
                  disabled={isPending}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
