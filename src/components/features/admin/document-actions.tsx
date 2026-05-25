'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { approveUserDocuments, rejectUserDocuments } from '@/actions/admin/users';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface AdminDocumentActionsProps {
  userId: string;
  hasPendingDocs: boolean;
}

export function AdminDocumentActions({ userId, hasPendingDocs }: AdminDocumentActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reasonAr, setReasonAr] = useState('');
  const [reasonEn, setReasonEn] = useState('');
  const router = useRouter();
  const t = useTranslations('admin.userDetail');

  if (!hasPendingDocs) return null;

  const handleApprove = () => {
    startTransition(async () => {
      await approveUserDocuments(userId);
      router.refresh();
    });
  };

  const handleReject = () => {
    if (!reasonAr.trim()) return;
    startTransition(async () => {
      await rejectUserDocuments(userId, reasonAr.trim(), reasonEn.trim());
      setShowReject(false);
      setReasonAr('');
      setReasonEn('');
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          loading={isPending}
          onClick={handleApprove}
        >
          <CheckCircle className="me-1 h-4 w-4" />
          {t('approveDocs')}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          loading={isPending}
          onClick={() => setShowReject(!showReject)}
        >
          <XCircle className="me-1 h-4 w-4" />
          {t('rejectDocs')}
        </Button>
      </div>

      {showReject && (
        <div className="space-y-2">
          <textarea
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
            rows={2}
            placeholder={t('rejectReasonAr')}
            value={reasonAr}
            onChange={(e) => setReasonAr(e.target.value)}
          />
          <textarea
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
            rows={2}
            placeholder={t('rejectReasonEn')}
            value={reasonEn}
            onChange={(e) => setReasonEn(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              loading={isPending}
              disabled={!reasonAr.trim()}
              onClick={handleReject}
            >
              {t('confirmReject')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowReject(false)}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
