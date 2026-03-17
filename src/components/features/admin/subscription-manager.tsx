'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { changeUserSubscription, extendUserSubscription, cancelUserSubscription } from '@/actions/admin/subscriptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

interface SubscriptionManagerButtonProps {
  userId: string;
  currentTier: string;
  currentStatus: string;
  subscriptionId: string;
}

export function SubscriptionManagerButton({
  userId,
  currentTier,
  currentStatus,
  subscriptionId,
}: SubscriptionManagerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();
  const t = useTranslations('admin.subscriptionManager');

  const [newTier, setNewTier] = useState(currentTier);
  const [extendDays, setExtendDays] = useState('30');
  const [reason, setReason] = useState('');

  const handleChangePlan = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      const res = await changeUserSubscription(userId, newTier, reason);
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('success') });
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleExtend = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      const res = await extendUserSubscription(userId, Number(extendDays), reason);
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('success') });
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    if (!confirm(t('confirmCancel'))) return;
    startTransition(async () => {
      const res = await cancelUserSubscription(userId, reason || 'Admin cancellation');
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('success') });
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  if (!isOpen) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <Settings className="me-1 h-3 w-3" />
        {t('title')}
      </Button>
    );
  }

  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-lg space-y-3 min-w-70"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t('title')}</h4>
        <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
          &times;
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {t('currentPlan')}: <Badge variant={currentTier as 'starter' | 'pro' | 'business' | 'enterprise'}>{currentTier}</Badge>
      </div>

      {/* Change Tier */}
      <div className="space-y-2">
        <label className="text-xs font-medium">{t('newTier')}</label>
        <select
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={newTier}
          onChange={(e) => setNewTier(e.target.value)}
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Extend Days */}
      <div className="space-y-2">
        <label className="text-xs font-medium">{t('extendDays')}</label>
        <Input
          type="number"
          value={extendDays}
          onChange={(e) => setExtendDays(e.target.value)}
          min={1}
          max={365}
          className="h-9"
        />
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <label className="text-xs font-medium">{t('reason')}</label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('reason')}
          className="h-9"
        />
      </div>

      {result && (
        <p className={`text-xs ${result.type === 'error' ? 'text-destructive' : 'text-success'}`}>
          {result.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" loading={isPending} onClick={handleChangePlan} disabled={newTier === currentTier}>
          {t('changePlan')}
        </Button>
        <Button size="sm" variant="outline" loading={isPending} onClick={handleExtend}>
          {t('extendSubscription')}
        </Button>
        <Button size="sm" variant="destructive" loading={isPending} onClick={handleCancel}>
          {t('cancelSubscription')}
        </Button>
      </div>
    </div>
  );
}
