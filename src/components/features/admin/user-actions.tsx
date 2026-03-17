'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { approveUserDocuments, banUser, unbanUser, restrictUser, unrestrictUser } from '@/actions/admin/users';
import { Button } from '@/components/ui/button';

interface AdminUserActionsProps {
  userId: string;
  currentStatus: string;
  isAdmin: boolean;
}

export function AdminUserActions({ userId, currentStatus, isAdmin }: AdminUserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.adminUser');

  if (isAdmin) return null; // Can't modify admin accounts

  const handleAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
      {(currentStatus === 'pending_approval' || currentStatus === 'pending_documents') && (
        <Button
          size="sm"
          variant="primary"
          loading={isPending}
          onClick={() => handleAction(() => approveUserDocuments(userId))}
        >
          {t('approve')}
        </Button>
      )}

      {currentStatus === 'active' && (
        <>
          <Button
            size="sm"
            variant="outline"
            loading={isPending}
            onClick={() => handleAction(() => restrictUser(userId, t('adminRestriction')))}
          >
            {t('restrict')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            loading={isPending}
            onClick={() => handleAction(() => banUser(userId, t('adminBan')))}
          >
            {t('ban')}
          </Button>
        </>
      )}

      {currentStatus === 'banned' && (
        <Button
          size="sm"
          variant="outline"
          loading={isPending}
          onClick={() => handleAction(() => unbanUser(userId))}
        >
          {t('unban')}
        </Button>
      )}

      {currentStatus === 'restricted' && (
        <Button
          size="sm"
          variant="outline"
          loading={isPending}
          onClick={() => handleAction(() => unrestrictUser(userId))}
        >
          {t('unrestrict')}
        </Button>
      )}
    </div>
  );
}
