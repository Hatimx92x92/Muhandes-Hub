// =============================================================================
// Merge Clients Modal — Client Component (Side-by-side comparison + merge)
// =============================================================================

'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { detectDuplicates, mergeClients } from '@/actions/crm';

interface DuplicateClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  pipeline_stage: string;
  matchReasons: string[];
}

interface Props {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientCompany: string | null;
  clientStage: string;
}

export function MergeClientsModal({
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  clientCompany,
  clientStage,
}: Props) {
  const [open, setOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateClient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('features.mergeClients');

  function handleOpen() {
    setError(null);
    setSuccess(false);
    setDuplicates([]);
    setSelectedId(null);
    setOpen(true);

    startTransition(async () => {
      const result = await detectDuplicates({
        name: clientName,
        email: clientEmail ?? undefined,
        phone: clientPhone ?? undefined,
        company: clientCompany ?? undefined,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Exclude the current client from results
        const filtered = result.data.duplicates.filter((d) => d.id !== clientId);
        setDuplicates(filtered);
      }
    });
  }

  function handleMerge() {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      const result = await mergeClients(clientId, selectedId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setOpen(false), 1500);
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" className="w-full" onClick={handleOpen}>
        {t('findDuplicates')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-success/10 p-3 text-sm text-success">
              {t('mergeSuccess')}
            </div>
          )}

          {!success && (
            <>
              {/* Current Client */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t('primaryClient')}</p>
                <p className="font-semibold">{clientName}</p>
                {clientCompany && <p className="text-sm text-muted-foreground">{clientCompany}</p>}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {clientEmail && <span>{clientEmail}</span>}
                  {clientPhone && <span dir="ltr">{clientPhone}</span>}
                </div>
              </div>

              {/* Duplicates List */}
              {isPending && duplicates.length === 0 && !error && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('searching')}
                </div>
              )}

              {!isPending && duplicates.length === 0 && !error && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('noDuplicates')}
                </div>
              )}

              {duplicates.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('potentialDuplicates', { count: duplicates.length })}
                  </p>
                  {duplicates.map((dup) => (
                    <button
                      key={dup.id}
                      type="button"
                      onClick={() => setSelectedId(dup.id === selectedId ? null : dup.id)}
                      className={`w-full rounded-lg border p-3 text-start transition-colors ${
                        selectedId === dup.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-medium truncate">{dup.name}</p>
                          {dup.company && (
                            <p className="text-sm text-muted-foreground">{dup.company}</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {dup.email && <span>{dup.email}</span>}
                            {dup.phone && <span dir="ltr">{dup.phone}</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 shrink-0">
                          {dup.matchReasons.map((reason) => (
                            <Badge key={reason} variant="outline" className="text-[10px]">
                              {t(`matchReason.${reason}`)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <DialogFooter>
            {!success && duplicates.length > 0 && selectedId && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleMerge}
                disabled={isPending}
                loading={isPending}
              >
                {t('mergeSelected')}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {success ? t('close') : t('keepSeparate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
