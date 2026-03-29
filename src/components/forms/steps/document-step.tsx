'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/forms/file-upload';
import { FileText, ShieldCheck } from 'lucide-react';
import type { WizardData } from '../register-wizard';

// =============================================================================
// Step: Document Upload (for Pro+ contractors/suppliers)
// =============================================================================

interface DocumentStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DocumentStep({ data, updateData, onNext, onBack }: DocumentStepProps) {
  const t = useTranslations('auth.documentStep');
  const tc = useTranslations('common');
  const [crDocs, setCrDocs] = useState<File[]>(data.verification_docs?.filter(f => f.name.startsWith('cr_')) || []);
  const [vatDocs, setVatDocs] = useState<File[]>(data.verification_docs?.filter(f => f.name.startsWith('vat_')) || []);
  const [classDocs, setClassDocs] = useState<File[]>(data.verification_docs?.filter(f => f.name.startsWith('class_')) || []);

  const isContractor = data.role === 'contractor';

  const handleDocsChange = (cr: File[], vat: File[], cls: File[]) => {
    updateData({ verification_docs: [...cr, ...vat, ...cls] });
  };

  const handleCrChange = (files: File[]) => {
    // Tag files with prefix for identification
    const tagged = files.map(f => new File([f], `cr_${f.name}`, { type: f.type }));
    setCrDocs(tagged);
    handleDocsChange(tagged, vatDocs, classDocs);
  };

  const handleVatChange = (files: File[]) => {
    const tagged = files.map(f => new File([f], `vat_${f.name}`, { type: f.type }));
    setVatDocs(tagged);
    handleDocsChange(crDocs, tagged, classDocs);
  };

  const handleClassChange = (files: File[]) => {
    const tagged = files.map(f => new File([f], `class_${f.name}`, { type: f.type }));
    setClassDocs(tagged);
    handleDocsChange(crDocs, vatDocs, tagged);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="space-y-5">
        {/* CR Certificate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('crCertificate')}</span>
          </div>
          <FileUpload
            name="cr_certificate"
            accept="application/pdf,image/jpeg,image/png"
            maxSize={10}
            maxFiles={1}
            hint={t('crHint')}
            onUpload={handleCrChange}
          />
        </div>

        {/* VAT Certificate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('vatCertificate')}</span>
          </div>
          <FileUpload
            name="vat_certificate"
            accept="application/pdf,image/jpeg,image/png"
            maxSize={10}
            maxFiles={1}
            hint={t('vatHint')}
            onUpload={handleVatChange}
          />
        </div>

        {/* Classification Certificate (contractors only) */}
        {isContractor && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('classCertificate')}</span>
            </div>
            <FileUpload
              name="class_certificate"
              accept="application/pdf,image/jpeg,image/png"
              maxSize={10}
              maxFiles={1}
              hint={t('classHint')}
              onUpload={handleClassChange}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t('optional')}
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {tc('back')}
        </Button>
        <Button onClick={onNext} className="flex-1">
          {tc('next')}
        </Button>
      </div>
    </div>
  );
}
