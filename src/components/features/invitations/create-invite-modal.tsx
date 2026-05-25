'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InviteToQuoteForm } from '@/components/features/invitations/invite-to-quote-form';
import { InviteToBidForm } from '@/components/features/invitations/invite-to-bid-form';
import { Plus, FileText, Gavel, ArrowRight } from 'lucide-react';

// =============================================================================
// CreateInviteModal — two-step modal: choose type → fill form
// =============================================================================

interface CreateInviteModalProps {
  projects: { id: string; title: string }[];
  suppliers: { id: string; companyName: string }[];
  contractors: { id: string; companyName: string }[];
  hasPublishedProjects: boolean;
}

export function CreateInviteModal({
  projects,
  suppliers,
  contractors,
  hasPublishedProjects,
}: CreateInviteModalProps) {
  const t = useTranslations('dashboard.invitations');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'choose' | 'quote' | 'bid'>('choose');

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setStep('choose');
  };

  const handleSuccess = () => {
    setOpen(false);
    setStep('choose');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        disabled={!hasPublishedProjects}
        render={
          <Button disabled={!hasPublishedProjects}>
            <Plus className="me-2 h-4 w-4" />
            {t('createInvite')}
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        {step === 'choose' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('createInvite')}</DialogTitle>
              <DialogDescription>{t('chooseTypeDesc')}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <button
                type="button"
                onClick={() => setStep('quote')}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t('inviteToQuoteTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('inviteToQuoteDesc')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setStep('bid')}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Gavel className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t('inviteToBidTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('inviteToBidDesc')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </div>
          </>
        )}

        {step === 'quote' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('inviteToQuoteTitle')}</DialogTitle>
              <DialogDescription>{t('inviteToQuoteDesc')}</DialogDescription>
            </DialogHeader>
            <InviteToQuoteForm
              projects={projects}
              suppliers={suppliers}
              onSuccess={handleSuccess}
            />
          </>
        )}

        {step === 'bid' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('inviteToBidTitle')}</DialogTitle>
              <DialogDescription>{t('inviteToBidDesc')}</DialogDescription>
            </DialogHeader>
            <InviteToBidForm
              projects={projects}
              contractors={contractors}
              onSuccess={handleSuccess}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
