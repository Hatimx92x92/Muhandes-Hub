'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { approveUserDocuments, banUser, unbanUser, restrictUser, unrestrictUser } from '@/actions/admin/users';
import { adminStartConversation } from '@/actions/messages';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface AdminUserActionsProps {
  userId: string;
  currentStatus: string;
  isAdmin: boolean;
}

export function AdminUserActions({ userId, currentStatus, isAdmin }: AdminUserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.adminUser');

  const handleSendMessage = () => {
    startTransition(async () => {
      const res = await adminStartConversation(userId);
      if (res.data) {
        router.push(`/admin/messages/${res.data.conversationId}` as Parameters<typeof router.push>[0]);
      }
    });
  };

  if (isAdmin) {
    return (
      <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" loading={isPending} onClick={handleSendMessage}>
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    );
  }

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

      <Button
        size="sm"
        variant="ghost"
        loading={isPending}
        onClick={handleSendMessage}
        title={t('sendMessage')}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
}
