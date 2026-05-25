'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { approvePost, rejectPost } from '@/actions/admin/moderation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AdminPostActionsProps {
  postId: string;
  postType: 'project' | 'product' | 'rfq';
}

export function AdminPostActions({ postId, postType }: AdminPostActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reasonAr, setReasonAr] = useState('');
  const [reasonEn, setReasonEn] = useState('');
  const router = useRouter();
  const t = useTranslations('features.adminPost');

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approvePost(postId, postType);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('approveSuccess'));
      }
      router.refresh();
    });
  };

  const handleReject = () => {
    if (!reasonAr.trim()) return;
    startTransition(async () => {
      const result = await rejectPost(postId, postType, reasonAr.trim(), reasonEn.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('rejectSuccess'));
      }
      router.refresh();
      setShowReject(false);
    });
  };

  if (showReject) {
    return (
      <div className="space-y-2">
        <Textarea
          placeholder={t('rejectReasonArPlaceholder')}
          value={reasonAr}
          onChange={(e) => setReasonAr(e.target.value)}
          rows={2}
        />
        <Textarea
          placeholder={t('rejectReasonEnPlaceholder')}
          dir="ltr"
          value={reasonEn}
          onChange={(e) => setReasonEn(e.target.value)}
          rows={2}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            loading={isPending}
            onClick={handleReject}
            disabled={!reasonAr.trim()}
          >
            {t('confirmReject')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowReject(false)}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="primary" loading={isPending} onClick={handleApprove}>
        {t('approve')}
      </Button>
      <Button size="sm" variant="destructive" loading={isPending} onClick={() => setShowReject(true)}>
        {t('reject')}
      </Button>
    </div>
  );
}
