'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  FileImage,
  CreditCard,
  Shield,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { LocaleDate } from '@/components/ui/locale-date';
import { getProxyUrl } from '@/lib/file-utils';
import { Link } from '@/i18n/navigation';
import type { AdminRegistrationRow } from '@/actions/admin/queries';

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  pending_email: 'info',
  pending_payment: 'pending',
  pending_documents: 'pending',
  pending_approval: 'warning',
};

const DOC_STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  pending: 'pending',
  approved: 'success',
  rejected: 'destructive',
};

interface RegistrationDetailModalProps {
  registration: AdminRegistrationRow;
  translations: Record<string, string>;
}

export function RegistrationDetailModal({ registration: r, translations: t }: RegistrationDetailModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <>
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="ghost" size="sm">
              <Eye className="me-1 h-3.5 w-3.5" />
              {t['viewDetails'] ?? 'View'}
            </Button>
          }
        />
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t['registrationDetail'] ?? 'Registration Details'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Status + Role */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANTS[r.verification_status] ?? 'secondary'}>
                {t[`status_${r.verification_status}`] ?? r.verification_status}
              </Badge>
              <Badge variant={r.role as BadgeProps['variant']}>
                {t[`role_${r.role}`] ?? r.role}
              </Badge>
              {r.profile_type && (
                <Badge variant="outline">
                  {t[`pt_${r.profile_type}`] ?? r.profile_type}
                </Badge>
              )}
              {r.provider && r.provider !== 'email' && (
                <Badge variant="info">{r.provider}</Badge>
              )}
            </div>

            {/* Personal Info */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h4 className="text-sm font-semibold">{t['personalInfo'] ?? 'Personal Information'}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{r.full_name ?? '—'}</span>
                </div>
                {r.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span dir="ltr">{r.email}</span>
                  </div>
                )}
                {r.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span dir="ltr">{r.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            {(r.company_name_ar || r.company_name_en) && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4" />
                  {t['companyInfo'] ?? 'Company Information'}
                </h4>
                <div className="space-y-2 text-sm">
                  {r.company_name_ar && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t['companyAr'] ?? 'Arabic'}</p>
                      <p dir="rtl" className="font-medium">{r.company_name_ar}</p>
                    </div>
                  )}
                  {r.company_name_en && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t['companyEn'] ?? 'English'}</p>
                      <p dir="ltr" className="font-medium">{r.company_name_en}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CR & VAT Numbers */}
            {(r.cr_number || r.vat_number) && (
              <div className="rounded-lg border border-border p-4 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4" />
                  {t['legalInfo'] ?? 'Legal Information'}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm" dir="ltr">
                  {r.cr_number && (
                    <>
                      <span className="text-muted-foreground">{t['cr_label'] ?? 'CR Number'}</span>
                      <span className="font-mono font-medium">{r.cr_number}</span>
                    </>
                  )}
                  {r.vat_number && (
                    <>
                      <span className="text-muted-foreground">{t['vat_label'] ?? 'VAT Number'}</span>
                      <span className="font-mono font-medium">{r.vat_number}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Subscription & Payment */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4" />
                {t['subscriptionPayment'] ?? 'Subscription & Payment'}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">{t['col_tier'] ?? 'Tier'}</span>
                <span className="text-end">
                  <Badge variant="outline">{t[`tier_${r.subscription_tier}`] ?? r.subscription_tier}</Badge>
                </span>
                <span className="text-muted-foreground">{t['col_payment'] ?? 'Payment'}</span>
                <span className="text-end">
                  {r.payment_method ? (t[`pm_${r.payment_method}`] ?? r.payment_method) : (t['pm_free'] ?? 'Free')}
                </span>
                {r.payment_status && (
                  <>
                    <span className="text-muted-foreground">{t['paymentStatus'] ?? 'Status'}</span>
                    <span className="text-end">
                      <Badge variant={r.payment_status === 'completed' ? 'success' : r.payment_status === 'failed' ? 'destructive' : 'pending'}>
                        {t[`ps_${r.payment_status}`] ?? r.payment_status}
                      </Badge>
                    </span>
                  </>
                )}
                {r.final_price != null && r.final_price > 0 && (
                  <>
                    <span className="text-muted-foreground">{t['price'] ?? 'Price'}</span>
                    <span className="text-end font-medium">{formatSAR(r.final_price)}</span>
                  </>
                )}
              </div>
              {r.bank_receipt_url && (
                <a
                  href={getProxyUrl(r.bank_receipt_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  <FileImage className="h-4 w-4" />
                  {t['viewReceipt']}
                </a>
              )}
            </div>

            {/* Verification Documents */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" />
                {t['col_documents'] ?? 'Documents'} ({r.documents.length})
              </h4>
              {r.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t['noDocs'] ?? 'No documents uploaded'}</p>
              ) : (
                <div className="space-y-2">
                  {r.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {t[`doc_${doc.document_type}`] ?? doc.document_type}
                          </span>
                          <Badge variant={DOC_STATUS_VARIANTS[doc.status] ?? 'secondary'} className="text-[10px]">
                            {t[`doc_${doc.status}`] ?? doc.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <LocaleDate date={doc.created_at} />
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewUrl(getProxyUrl(doc.file_url))}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <a
                          href={getProxyUrl(doc.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {t['col_created'] ?? 'Registered'}: <LocaleDate date={r.created_at} />
            </div>

            {/* View Full Profile Link */}
            <Link
              href={`/admin/users/${r.id}` as '/admin/users/[id]'}
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full">
                {t['viewFullProfile'] ?? 'View Full Profile'} →
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t['documentPreview'] ?? 'Document Preview'}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="overflow-hidden rounded-lg border border-border">
              {/\.(jpg|jpeg|png|gif|webp)$/i.test(previewUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Document"
                  className="max-h-[70vh] w-full object-contain bg-muted"
                />
              ) : (
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className="h-[70vh] w-full"
                >
                  <div className="flex flex-col items-center justify-center gap-2 p-8">
                    <p className="text-sm text-muted-foreground">Cannot display inline</p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {t['openInNewTab'] ?? 'Open in new tab'} →
                    </a>
                  </div>
                </object>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
