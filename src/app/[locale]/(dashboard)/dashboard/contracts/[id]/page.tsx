// =============================================================================
// Contract Detail Page — Server Component
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractSignForm } from '@/components/features/contracts/contract-sign-form';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import QRCode from 'qrcode';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

const STATUS_VARIANTS: Record<string, string> = {
  draft: 'draft',
  sent: 'pending',
  signed: 'success',
  expired: 'secondary',
  cancelled: 'destructive',
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations('dashboard.contracts');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch contract
  const { data: contract } = await db(supabase)
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single();

  if (!contract) notFound();

  // Fetch signatures
  const { data: signatures } = await db(supabase)
    .from('contract_signatures')
    .select('*')
    .eq('contract_id', id)
    .order('signed_at', { ascending: true });

  // Fetch clauses attached to this contract (via additional_clauses array)
  const clauseIds = (contract.additional_clauses as string[]) || [];
  let clauseDetails: Record<string, unknown>[] = [];
  if (clauseIds.length > 0) {
    const { data } = await db(supabase)
      .from('contract_clauses')
      .select('*')
      .in('id', clauseIds);
    clauseDetails = data || [];
  }

  const partyA = (contract.party_a || {}) as Record<string, unknown>;
  const partyB = (contract.party_b || {}) as Record<string, unknown>;
  const statusVariant = STATUS_VARIANTS[(contract.status as string) || 'draft'] || STATUS_VARIANTS.draft;
  const isCreator = contract.creator_id === user.id;
  const hasUserSigned = (signatures || []).some(
    (s: Record<string, unknown>) => s.signer_id === user.id
  );

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={id} label={t(`template.${contract.template_type as string}`)} />
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">
              {t(`template.${contract.template_type as string}`)}
            </h1>
            <Badge variant={statusVariant as 'draft' | 'pending' | 'success' | 'secondary' | 'destructive'}>
              {t(`status.${(contract.status as string) || 'draft'}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {tCommon('createdAt')}: {new Date(contract.created_at as string).toLocaleDateString(locale)}
          </p>
          {!!contract.deal_id && (
            <Link
              href={`/dashboard/deals/${contract.deal_id}`}
              className="text-sm text-primary hover:underline"
            >
              {t('viewLinkedDeal')} ←
            </Link>
          )}
        </div>
        <a href={`/api/pdf/contract/${contract.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            {t('downloadPdf')}
          </Button>
        </a>
      </div>

      {/* Parties */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm text-primary">{t('partyA')}</h3>
          <p className="font-medium text-sm">{partyA.company_name_ar as string || partyA.name as string || '—'}</p>
          {!!partyA.company_name_en && (
            <p className="text-xs text-muted-foreground">{partyA.company_name_en as string}</p>
          )}
          {!!partyA.cr_number && (
            <p className="text-xs text-muted-foreground">{t('crNumber')}: {partyA.cr_number as string}</p>
          )}
          {!!partyA.vat_number && (
            <p className="text-xs text-muted-foreground">{t('vatNumber')}: {partyA.vat_number as string}</p>
          )}
          {!!partyA.phone && (
            <p className="text-xs text-muted-foreground">{partyA.phone as string}</p>
          )}
          {!!partyA.email && (
            <p className="text-xs text-muted-foreground">{partyA.email as string}</p>
          )}
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm text-primary">{t('partyB')}</h3>
          <p className="font-medium text-sm">{partyB.company_name_ar as string || partyB.name as string || '—'}</p>
          {!!partyB.company_name_en && (
            <p className="text-xs text-muted-foreground">{partyB.company_name_en as string}</p>
          )}
          {!!partyB.cr_number && (
            <p className="text-xs text-muted-foreground">{t('crNumber')}: {partyB.cr_number as string}</p>
          )}
          {!!partyB.vat_number && (
            <p className="text-xs text-muted-foreground">{t('vatNumber')}: {partyB.vat_number as string}</p>
          )}
          {!!partyB.phone && (
            <p className="text-xs text-muted-foreground">{partyB.phone as string}</p>
          )}
          {!!partyB.email && (
            <p className="text-xs text-muted-foreground">{partyB.email as string}</p>
          )}
        </Card>
      </div>

      {/* Contract Content */}
      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-bold">{t('contractDetails')}</h2>

        {!!(contract.scope_ar || contract.scope_en) && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{t('scopeOfWork')}</h3>
            {!!contract.scope_ar && <p className="text-sm whitespace-pre-wrap">{contract.scope_ar as string}</p>}
            {!!contract.scope_en && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{contract.scope_en as string}</p>}
          </div>
        )}

        {!!(contract.payment_terms_ar || contract.payment_terms_en) && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{t('paymentTerms')}</h3>
            {!!contract.payment_terms_ar && <p className="text-sm whitespace-pre-wrap">{contract.payment_terms_ar as string}</p>}
            {!!contract.payment_terms_en && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{contract.payment_terms_en as string}</p>}
          </div>
        )}

        {!!contract.timeline && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{t('timeline')}</h3>
            <p className="text-sm">{contract.timeline as string}</p>
          </div>
        )}

        {!!(contract.penalties_ar || contract.penalties_en) && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{t('penalties')}</h3>
            {!!contract.penalties_ar && <p className="text-sm whitespace-pre-wrap">{contract.penalties_ar as string}</p>}
            {!!contract.penalties_en && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{contract.penalties_en as string}</p>}
          </div>
        )}

        {!!(contract.warranty_ar || contract.warranty_en) && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{t('warranty')}</h3>
            {!!contract.warranty_ar && <p className="text-sm whitespace-pre-wrap">{contract.warranty_ar as string}</p>}
            {!!contract.warranty_en && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{contract.warranty_en as string}</p>}
          </div>
        )}

        {!!contract.governing_law && (
          <div>
            <h3 className="font-semibold text-sm mb-1">{t('governingLaw')}</h3>
            <p className="text-sm">{contract.governing_law as string}</p>
          </div>
        )}
      </Card>

      {/* Clauses */}
      {clauseDetails.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold">{t('attachedClauses')} ({clauseDetails.length})</h2>
          <div className="space-y-3">
            {clauseDetails.map(clause => (
              <div key={clause.id as string} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{clause.title_ar as string}</h4>
                  <Badge variant="secondary">{clause.category as string}</Badge>
                </div>
                <p className="text-xs whitespace-pre-wrap">{clause.content_ar as string}</p>
                {!!clause.content_en && (
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{clause.content_en as string}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Signatures */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold">{t('signaturesLabel')}</h2>
        {(signatures && signatures.length > 0) ? (
          <div className="space-y-3">
            {signatures.map((sig: Record<string, unknown>) => (
              <div key={sig.id as string} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{sig.signatory_name as string}</p>
                  <p className="text-xs text-muted-foreground">{sig.signatory_title as string}</p>
                </div>
                <div className="text-end">
                  <Badge variant="success">{t('signed')}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(sig.signed_at as string).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('noSignaturesYet')}</p>
        )}

        {/* Sign Button */}
        {!hasUserSigned && contract.status !== 'cancelled' && contract.status !== 'expired' && (
          <ContractSignForm contractId={id} />
        )}
      </Card>

      {/* QR Verification */}
      {!!contract.qr_uuid && (
        <Card className="p-4">
          <QrVerification qrUuid={contract.qr_uuid as string} label={t('verificationLink')} />
        </Card>
      )}
    </div>
  );
}

// Server component to generate QR code
async function QrVerification({ qrUuid, label }: { qrUuid: string; label: string }) {
  const verifyUrl = `https://muhandeshub.com/verify/contract/${qrUuid}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });

  return (
    <div className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="QR Code" width={120} height={120} className="rounded" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <code className="text-xs text-muted-foreground break-all">{verifyUrl}</code>
      </div>
    </div>
  );
}
