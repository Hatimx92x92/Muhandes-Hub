'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toggleContactRead, deleteContactSubmission } from '@/actions/admin/contact';
import { Button } from '@/components/ui/button';
import { EmailComposer } from '@/components/features/admin/email-composer';
import { Eye, EyeOff, Trash2, Mail } from 'lucide-react';

interface ContactSubmissionActionsProps {
  submissionId: string;
  isRead: boolean;
  email: string;
  name: string;
}

export function ContactSubmissionActions({ submissionId, isRead, email, name }: ContactSubmissionActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showComposer, setShowComposer] = useState(false);
  const router = useRouter();
  const t = useTranslations('admin.contactsPage');

  const handleToggleRead = () => {
    startTransition(async () => {
      await toggleContactRead(submissionId, !isRead);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm(t('deleteConfirm'))) return;
    startTransition(async () => {
      await deleteContactSubmission(submissionId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" loading={isPending} onClick={handleToggleRead}>
          {isRead ? <EyeOff className="me-1 h-3 w-3" /> : <Eye className="me-1 h-3 w-3" />}
          {isRead ? t('markUnread') : t('markRead')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowComposer(!showComposer)}>
          <Mail className="me-1 h-3 w-3" />
          {t('reply')}
        </Button>
        <Button size="sm" variant="destructive" loading={isPending} onClick={handleDelete}>
          <Trash2 className="me-1 h-3 w-3" />
          {t('delete')}
        </Button>
      </div>

      {showComposer && (
        <EmailComposer
          userEmail={email}
          userId={submissionId}
          userName={name}
          onClose={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}
