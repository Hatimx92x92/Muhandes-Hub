'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { approveSubscriptionPayment, rejectSubscriptionPayment } from '@/actions/admin/subscriptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CheckCircle, XCircle } from 'lucide-react';

interface PaymentActionButtonsProps {
  subscriptionId: string;
  paymentStatus: string | null;
}

export function PaymentActionButtons({ subscriptionId, paymentStatus }: PaymentActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();
  const t = useTranslations('admin.paymentActions');

  // Only show for non-completed payments
  if (!paymentStatus || paymentStatus === 'completed') return null;

  const handleApprove = () => {
    if (!confirm(t('approveConfirm'))) return;
    startTransition(async () => {
      const res = await approveSubscriptionPayment(subscriptionId);
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('approved') });
        router.refresh();
      }
    });
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      const res = await rejectSubscriptionPayment(subscriptionId, reason);
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('rejected') });
        setRejectOpen(false);
        setReason('');
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Approve Button */}
      <Button
        size="icon"
        variant="ghost"
        loading={isPending}
        onClick={(e) => {
          e.stopPropagation();
          handleApprove();
        }}
        title={t('approve')}
        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"
      >
        <CheckCircle className="h-4 w-4" />
      </Button>

      {/* Reject Button (with reason popover) */}
      <Popover open={rejectOpen} onOpenChange={setRejectOpen}>
        <PopoverTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => e.stopPropagation()}
              title={t('reject')}
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
            />
          }
        >
          <XCircle className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent
          className="w-64 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium">{t('rejectTitle')}</p>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('reasonPlaceholder')}
            className="h-8 text-sm"
          />
          {result?.type === 'error' && (
            <p className="text-xs text-destructive">{result.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setRejectOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              loading={isPending}
              disabled={!reason.trim()}
              onClick={handleReject}
            >
              {t('reject')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
