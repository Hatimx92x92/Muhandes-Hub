'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { adminUpdateAuth, adminGenerateResetLink } from '@/actions/admin/users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Mail,
  Phone,
  Shield,
  Calendar,
  KeyRound,
  CheckCircle,
  Copy,
} from 'lucide-react';

interface AdminAuthControlsProps {
  userId: string;
  auth: Record<string, unknown>;
  locale: string;
  isAdmin: boolean;
}

export function AdminAuthControls({ userId, auth, locale, isAdmin }: AdminAuthControlsProps) {
  const t = useTranslations('admin.userDetail');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  // Edit email
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Edit phone
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');

  // Reset link
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleEmailChange = () => {
    if (!newEmail.trim()) return;
    startTransition(async () => {
      const res = await adminUpdateAuth(userId, { email: newEmail });
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('saved') });
        setEditingEmail(false);
        setNewEmail('');
        router.refresh();
      }
    });
  };

  const handlePhoneChange = () => {
    if (!newPhone.trim()) return;
    startTransition(async () => {
      const res = await adminUpdateAuth(userId, { phone: newPhone });
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('saved') });
        setEditingPhone(false);
        setNewPhone('');
        router.refresh();
      }
    });
  };

  const handleForceVerify = () => {
    if (!confirm(t('forceVerifyEmailConfirm'))) return;
    startTransition(async () => {
      const res = await adminUpdateAuth(userId, { email_confirm: true });
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('saved') });
        router.refresh();
      }
    });
  };

  const handleGenerateResetLink = () => {
    startTransition(async () => {
      const res = await adminGenerateResetLink(userId);
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else if (res.data?.link) {
        setResetLink(res.data.link);
        setResult({ type: 'success', message: t('resetLinkGenerated') });
      }
    });
  };

  const handleCopyLink = async () => {
    if (resetLink) {
      await navigator.clipboard.writeText(resetLink);
      setResult({ type: 'success', message: t('resetLinkCopied') });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4" />
          {t('authInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <p className={`text-sm ${result.type === 'error' ? 'text-destructive' : 'text-success'}`}>
            {result.message}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('email')}</p>
              <p className="text-sm font-medium">{auth.email as string}</p>
              {!isAdmin && !editingEmail && (
                <Button size="sm" variant="ghost" className="mt-1 h-6 px-2 text-xs" onClick={() => setEditingEmail(true)}>
                  {t('changeEmail')}
                </Button>
              )}
              {editingEmail && (
                <div className="mt-1 flex items-center gap-1">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t('newEmail')}
                    type="email"
                    className="h-7 text-xs"
                  />
                  <Button size="sm" variant="primary" className="h-7 px-2 text-xs" loading={isPending} onClick={handleEmailChange}>
                    {t('apply')}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setEditingEmail(false); setNewEmail(''); }}>
                    <span>&times;</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <Phone className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('phone')}</p>
              <p className="text-sm font-medium">{(auth.phone as string) || t('notProvided')}</p>
              {!isAdmin && !editingPhone && (
                <Button size="sm" variant="ghost" className="mt-1 h-6 px-2 text-xs" onClick={() => setEditingPhone(true)}>
                  {t('changePhone')}
                </Button>
              )}
              {editingPhone && (
                <div className="mt-1 flex items-center gap-1">
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={t('newPhone')}
                    className="h-7 text-xs"
                  />
                  <Button size="sm" variant="primary" className="h-7 px-2 text-xs" loading={isPending} onClick={handlePhoneChange}>
                    {t('apply')}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setEditingPhone(false); setNewPhone(''); }}>
                    <span>&times;</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Provider */}
          <div className="flex items-start gap-3">
            <Shield className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('provider')}</p>
              <p className="text-sm font-medium capitalize">{auth.provider as string}</p>
            </div>
          </div>

          {/* Email Verified */}
          <div className="flex items-start gap-3">
            <Mail className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('emailVerified')}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge variant={auth.emailConfirmed ? 'success' : 'warning'}>
                  {auth.emailConfirmed ? t('yes') : t('no')}
                </Badge>
                {!isAdmin && !auth.emailConfirmed && (
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" loading={isPending} onClick={handleForceVerify}>
                    <CheckCircle className="me-1 h-3 w-3" />
                    {t('forceVerifyEmail')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Last Sign In */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('lastSignIn')}</p>
              <p className="text-sm font-medium">
                {auth.lastSignIn
                  ? new Date(auth.lastSignIn as string).toLocaleString(locale)
                  : t('never')}
              </p>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('createdAt')}</p>
              <p className="text-sm font-medium">
                {auth.createdAt
                  ? new Date(auth.createdAt as string).toLocaleString(locale)
                  : t('notProvided')}
              </p>
            </div>
          </div>
        </div>

        {/* Password Reset Section */}
        {!isAdmin && (
          <div className="mt-4 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('resetPassword')}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant="outline" loading={isPending} onClick={handleGenerateResetLink}>
                {t('generateLink')}
              </Button>
              {resetLink && (
                <Button size="sm" variant="ghost" onClick={handleCopyLink}>
                  <Copy className="me-1 h-3 w-3" />
                  {t('copyLink')}
                </Button>
              )}
            </div>
            {resetLink && (
              <div className="mt-2 rounded-md bg-muted/50 p-2">
                <p className="break-all text-xs font-mono text-muted-foreground">{resetLink}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
