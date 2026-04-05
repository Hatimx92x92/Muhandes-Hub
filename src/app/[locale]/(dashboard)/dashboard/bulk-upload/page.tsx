// =============================================================================
// Bulk Product Upload Page — Suppliers (Business+ tier)
// =============================================================================

'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertBanner } from '@/components/ui/alert-banner';
import { cn } from '@/lib/utils';
import { bulkImportProducts } from '@/actions/products';
import {
  Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// CSV Template
// ---------------------------------------------------------------------------

const CSV_TEMPLATE = `title_ar,title_en,description_ar,description_en,category_id,price,unit,moq,sku
"اسم المنتج","Product Name","وصف المنتج","Product description","","100.00","piece","1","SKU-001"`;

function downloadTemplate() {
  // Add BOM for proper Arabic display in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BulkUploadPage() {
  const t = useTranslations('dashboard.bulkUpload');
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const handleSubmit = () => {
    if (!file) {
      setError(t('noFile'));
      return;
    }

    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('csv_file', file);

    startTransition(async () => {
      const res = await bulkImportProducts(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setResult(res.data);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Instructions */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">{t('instructions')}</h2>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>{t('step1')}</li>
          <li>{t('step2')}</li>
          <li>{t('step3')}</li>
        </ol>
        <p className="text-xs text-muted-foreground">{t('columns')}</p>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 me-2" />
          {t('downloadTemplate')}
        </Button>
      </Card>

      {/* Upload */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">{t('selectFile')}</h2>
        </div>

        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
              setResult(null);
            }}
            className="block w-full text-sm file:me-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t('maxSize')}</p>
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{file.name}</span>
            <Badge variant="default" className="text-[10px]">
              {(file.size / 1024).toFixed(1)} KB
            </Badge>
          </div>
        )}

        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isPending}
          disabled={!file || isPending}
        >
          <Upload className="h-4 w-4 me-2" />
          {isPending ? t('uploading') : t('importProducts')}
        </Button>
      </Card>

      {/* Results */}
      {result && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <h2 className="font-semibold">{t('results')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
              <p className="text-xs text-muted-foreground">{t('imported')}</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
              <p className="text-xs text-muted-foreground">{t('skipped')}</p>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg bg-red-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                <p className="text-xs text-muted-foreground">{t('errors')}</p>
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-1">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
