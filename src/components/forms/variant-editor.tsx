'use client';

// =============================================================================
// Muhandes HUB — Product Variant Editor
// =============================================================================

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VariantRow {
  name_ar: string;
  name_en: string;
  sku: string;
  price: string;
  stock_quantity: string;
}

interface VariantEditorProps {
  value: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  className?: string;
}

const emptyRow: VariantRow = {
  name_ar: '',
  name_en: '',
  sku: '',
  price: '',
  stock_quantity: '',
};

export function VariantEditor({ value, onChange, className }: VariantEditorProps) {
  const t = useTranslations('forms.variant');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'ar' | 'en';
  const sourceIsAr = locale === 'ar';

  // Track which rows have the secondary language expanded
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addRow = () => {
    onChange([...value, { ...emptyRow }]);
  };

  const removeRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    onChange(value.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof VariantRow, val: string) => {
    const updated = value.map((row, i) =>
      i === index ? { ...row, [field]: val } : row,
    );
    onChange(updated);
  };

  const primaryNameLabel = sourceIsAr ? t('nameAr') : t('nameEn');
  const secondaryNameLabel = sourceIsAr ? t('nameEn') : t('nameAr');
  const addTranslationLabel = sourceIsAr
    ? tCommon('addEnglishTranslation')
    : tCommon('addArabicTranslation');

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="me-1.5 h-3.5 w-3.5" />
          {t('addVariant')}
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('emptyHint')}</p>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden grid-cols-[auto_1fr_0.7fr_0.8fr_0.7fr_auto] gap-2 text-xs font-medium text-muted-foreground sm:grid">
            <span className="w-6" />
            <span>{primaryNameLabel}</span>
            <span>{t('sku')}</span>
            <span>{t('price')} (ر.س)</span>
            <span>{t('quantity')}</span>
            <span className="w-8" />
          </div>

          {/* Rows */}
          {value.map((row, index) => {
            const isExpanded = expandedRows.has(index);
            return (
              <div key={index} className="rounded-lg border border-border bg-card">
                <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[auto_1fr_0.7fr_0.8fr_0.7fr_auto] sm:items-center sm:p-2">
                  <GripVertical className="hidden h-4 w-4 text-muted-foreground sm:block" />

                  {/* Primary locale name */}
                  {sourceIsAr ? (
                    <Input
                      placeholder={t('nameAr')}
                      value={row.name_ar}
                      onChange={(e) => updateRow(index, 'name_ar', e.target.value)}
                    />
                  ) : (
                    <Input
                      placeholder={t('nameEn')}
                      dir="ltr"
                      value={row.name_en}
                      onChange={(e) => updateRow(index, 'name_en', e.target.value)}
                    />
                  )}

                  <Input
                    placeholder="SKU"
                    dir="ltr"
                    value={row.sku}
                    onChange={(e) => updateRow(index, 'sku', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('price')}
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => updateRow(index, 'price', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={t('quantity')}
                    min="0"
                    value={row.stock_quantity}
                    onChange={(e) => updateRow(index, 'stock_quantity', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                    aria-label={t('deleteVariant')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Secondary locale name — expandable */}
                {isExpanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <p className="mb-1.5 text-xs text-muted-foreground">{secondaryNameLabel}</p>
                    {sourceIsAr ? (
                      <Input
                        placeholder={t('nameEn')}
                        dir="ltr"
                        value={row.name_en}
                        onChange={(e) => updateRow(index, 'name_en', e.target.value)}
                      />
                    ) : (
                      <Input
                        placeholder={t('nameAr')}
                        value={row.name_ar}
                        onChange={(e) => updateRow(index, 'name_ar', e.target.value)}
                      />
                    )}
                  </div>
                )}

                {/* Toggle */}
                <div className="border-t border-border px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(index)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Languages className="h-3 w-3" />
                    {isExpanded ? tCommon('hideTranslation') : addTranslationLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
