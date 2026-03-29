'use client';

import { useState, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertBanner } from '@/components/ui/alert-banner';
import { uploadVerificationDocuments, logout } from '@/actions/auth';

// =============================================================================
// Gate 3: Document Upload (VAT Certificate + Commercial License)
// =============================================================================

export default function DocumentsPage() {
  const router = useRouter();
  const t = useTranslations('verify.documents');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vatFile, setVatFile] = useState<File | null>(null);
  const [crFile, setCrFile] = useState<File | null>(null);
  const vatRef = useRef<HTMLInputElement>(null);
  const crRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!vatFile || !crFile) {
      setError(t('validation'));
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('vat_certificate', vatFile);
    formData.set('cr_license', crFile);

    const result = await uploadVerificationDocuments(null, formData);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push('/verify/pending-approval');
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <AlertBanner variant="error">{error}</AlertBanner>
        )}

        {/* VAT Certificate */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('vatCert')}</label>
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:bg-muted/50"
            onClick={() => vatRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && vatRef.current?.click()}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {vatFile ? vatFile.name : t('vatCert')}
            </span>
            <input
              ref={vatRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setVatFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Commercial License */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('crDoc')}</label>
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:bg-muted/50"
            onClick={() => crRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && crRef.current?.click()}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {crFile ? crFile.name : t('crDoc')}
            </span>
            <input
              ref={crRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setCrFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !vatFile || !crFile}
          loading={submitting}
        >
          {t('submit')}
        </Button>

        <Button variant="ghost" className="w-full" onClick={handleLogout}>
          {t('logout')}
        </Button>
      </CardContent>
    </Card>
  );
}
