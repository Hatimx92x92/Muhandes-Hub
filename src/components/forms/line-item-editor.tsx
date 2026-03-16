// =============================================================================
// Line Item Editor — Dynamic line items for quotations
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { VAT_RATE } from '@/types';

export interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface LineItemEditorProps {
  /** Hidden input name for the JSON value */
  name?: string;
  /** Initial line items */
  defaultItems?: LineItem[];
  /** Callback on change */
  onChange?: (items: LineItem[]) => void;
  /** Error message */
  error?: string;
}

const emptyItem: LineItem = { description: '', quantity: 1, unit: 'unit', unit_price: 0 };

const unitKeys = [
  'unitUnit', 'unitPiece', 'unitTon', 'unitKg', 'unitMeter',
  'unitSqMeter', 'unitCuMeter', 'unitLiter', 'unitCarton',
  'unitPallet', 'unitShipment', 'unitWorkDay', 'unitHour',
] as const;

export function LineItemEditor({ name = 'line_items', defaultItems, onChange, error }: LineItemEditorProps) {
  const t = useTranslations('forms.lineItem');
  const [items, setItems] = useState<LineItem[]>(
    defaultItems && defaultItems.length > 0 ? defaultItems : [{ ...emptyItem }],
  );

  const updateItems = useCallback(
    (newItems: LineItem[]) => {
      setItems(newItems);
      onChange?.(newItems);
    },
    [onChange],
  );

  const addItem = () => {
    updateItems([...items, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    updateItems(items.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    });
    updateItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  return (
    <div className="space-y-4">
      {/* Hidden input with JSON value for form submission */}
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {/* Header row */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
        <div className="col-span-4">{t('description')}</div>
        <div className="col-span-2">{t('quantity')}</div>
        <div className="col-span-2">{t('unit')}</div>
        <div className="col-span-2">{t('unitPrice')}</div>
        <div className="col-span-1">{t('total')}</div>
        <div className="col-span-1" />
      </div>

      {/* Items */}
      {items.map((item, index) => {
        const lineTotal = item.quantity * item.unit_price;
        return (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start rounded-lg border border-border p-3 sm:border-0 sm:p-0"
          >
            {/* Description */}
            <div className="sm:col-span-4">
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">{t('description')}</label>
              <Input
                placeholder={t('descPlaceholder')}
                value={item.description}
                onChange={(e) => updateField(index, 'description', e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">{t('quantity')}</label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="1"
                value={item.quantity || ''}
                onChange={(e) => updateField(index, 'quantity', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Unit */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">{t('unit')}</label>
              <select
                value={item.unit}
                onChange={(e) => updateField(index, 'unit', e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              >
                {unitKeys.map((key) => (
                  <option key={key} value={key}>{t(key)}</option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">{t('unitPrice')}</label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0.00"
                dir="ltr"
                value={item.unit_price || ''}
                onChange={(e) => updateField(index, 'unit_price', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Line Total */}
            <div className="sm:col-span-1 flex items-center">
              <span className="text-sm font-medium text-foreground">
                {lineTotal > 0 ? formatSAR(lineTotal, 'en') : '—'}
              </span>
            </div>

            {/* Remove */}
            <div className="sm:col-span-1 flex items-center">
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
                className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
                title={t('deleteItem')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add item button */}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 me-1" />
        {t('addItem')}
      </Button>

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('subtotal')}</span>
          <span className="font-medium text-foreground">{formatSAR(subtotal, 'en')}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('vat15')}</span>
          <span className="font-medium text-foreground">{formatSAR(vat, 'en')}</span>
        </div>
        <div className="flex items-center justify-between text-base font-bold">
          <span className="text-foreground">{t('grandTotal')}</span>
          <span className="text-primary">{formatSAR(total, 'en')}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
