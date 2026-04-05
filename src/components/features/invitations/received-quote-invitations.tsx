'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { acceptQuoteInvitation, declineQuoteInvitation } from '@/actions/inquiries';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { CurrencyInput } from '@/components/forms/currency-input';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { FileText, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionResult } from '@/types';
import { useState } from 'react';

interface QuoteInvitation {
  id: string;
  requester_id: string;
  requester_name: string;
  project_id: string;
  project_title: string;
  description_ar: string;
  description_en: string | null;
  status: string;
  created_at: string;
}

interface ReceivedQuoteInvitationsProps {
  invitations: QuoteInvitation[];
}

export function ReceivedQuoteInvitations({ invitations }: ReceivedQuoteInvitationsProps) {
  const t = useTranslations('dashboard.invitations');

  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title={t('noQuoteInvitations')}
        description={t('noQuoteInvitationsDesc')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((inv) => (
        <QuoteInvitationCard key={inv.id} invitation={inv} />
      ))}
    </div>
  );
}

function QuoteInvitationCard({ invitation }: { invitation: QuoteInvitation }) {
  const t = useTranslations('dashboard.invitations');
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const isPending = invitation.status === 'pending';

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{invitation.project_title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('from')}: {invitation.requester_name}
          </p>
        </div>
        <Badge variant={isPending ? 'secondary' : invitation.status === 'accepted' ? 'default' : 'destructive'}>
          {t(`status_${invitation.status}`)}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">{invitation.description_ar}</p>
      {invitation.description_en && (
        <p className="text-sm text-muted-foreground" dir="ltr">{invitation.description_en}</p>
      )}

      {isPending && !showAcceptForm && !showDeclineForm && (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => setShowAcceptForm(true)}
          >
            <Check className="h-4 w-4" />
            {t('acceptAndQuote')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeclineForm(true)}
          >
            <X className="h-4 w-4" />
            {t('decline')}
          </Button>
        </div>
      )}

      {showAcceptForm && <AcceptForm requestId={invitation.id} onCancel={() => setShowAcceptForm(false)} />}
      {showDeclineForm && <DeclineForm requestId={invitation.id} onCancel={() => setShowDeclineForm(false)} />}
    </Card>
  );
}

function AcceptForm({ requestId, onCancel }: { requestId: string; onCancel: () => void }) {
  const t = useTranslations('dashboard.invitations');
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ quotationId: string }> | null,
    FormData
  >(acceptQuoteInvitation, null);

  if (state?.data) {
    return <AlertBanner variant="success">{t('quotationCreated')}</AlertBanner>;
  }

  return (
    <form action={formAction} className={cn('space-y-4 rounded-lg border border-border p-4')}>
      <input type="hidden" name="request_id" value={requestId} />

      {state?.error && <AlertBanner variant="error">{state.error}</AlertBanner>}

      <FormField label={t('quotationAmount')} name="amount" required>
        <CurrencyInput name="amount" placeholder="0.00" showVat />
      </FormField>

      <FormField label={t('quotationDescAr')} name="description_ar" required>
        <Textarea name="description_ar" rows={3} placeholder={t('quotationDescArPlaceholder')} />
      </FormField>

      <FormField label={t('quotationDescEn')} name="description_en">
        <Textarea name="description_en" rows={3} dir="ltr" placeholder={t('quotationDescEnPlaceholder')} />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t('sending') : t('sendQuotation')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}

function DeclineForm({ requestId, onCancel }: { requestId: string; onCancel: () => void }) {
  const t = useTranslations('dashboard.invitations');
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(declineQuoteInvitation, null);

  if (state?.data !== undefined && !state?.error) {
    return <AlertBanner variant="success">{t('invitationDeclined')}</AlertBanner>;
  }

  return (
    <form action={formAction} className={cn('space-y-4 rounded-lg border border-border p-4')}>
      <input type="hidden" name="request_id" value={requestId} />

      {state?.error && <AlertBanner variant="error">{state.error}</AlertBanner>}

      <FormField label={t('declineReason')} name="reason">
        <Textarea name="reason" rows={2} placeholder={t('declineReasonPlaceholder')} />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
          {isPending ? t('sending') : t('confirmDecline')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
