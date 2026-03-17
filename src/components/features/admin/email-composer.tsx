'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { sendEmailToUser } from '@/actions/admin/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

interface EmailComposerProps {
  userEmail: string;
  userId: string;
  userName?: string;
  onClose?: () => void;
}

export function EmailComposer({ userEmail, userId, userName, onClose }: EmailComposerProps) {
  const t = useTranslations('admin.emailComposer');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const templates = [
    { key: 'completeRegistration', subject: 'Complete Your Registration / أكمل تسجيلك', body: 'Please complete your registration to start using the platform.\nيرجى إكمال تسجيلك لبدء استخدام المنصة.' },
    { key: 'accountStatus', subject: 'Account Status Update / تحديث حالة الحساب', body: 'Your account status has been updated. Please check your dashboard.\nتم تحديث حالة حسابك. يرجى التحقق من لوحة التحكم.' },
  ];

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;
    startTransition(async () => {
      const res = await sendEmailToUser(userEmail, subject, body, userId);
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('success') });
        setSubject('');
        setBody('');
      }
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4" />
          {t('title')}
        </h4>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose}>&times;</Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {t('to')}: <span className="font-medium text-foreground">{userName ?? userEmail}</span> ({userEmail})
      </div>

      {/* Quick templates */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">{t('templates')}:</span>
        {templates.map((tmpl) => (
          <Button
            key={tmpl.key}
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => { setSubject(tmpl.subject); setBody(tmpl.body); }}
          >
            {t(tmpl.key)}
          </Button>
        ))}
      </div>

      <Input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder={t('subject')}
      />

      <textarea
        className="w-full min-h-30 rounded-lg border border-border bg-background p-3 text-sm resize-y"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('body')}
      />

      {result && (
        <p className={`text-xs ${result.type === 'error' ? 'text-destructive' : 'text-success'}`}>
          {result.message}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="primary" size="sm" loading={isPending} onClick={handleSend}>
          {t('send')}
        </Button>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}
