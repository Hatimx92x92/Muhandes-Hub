'use client';

import { forwardRef, useState, type InputHTMLAttributes, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { VAT_RATE } from '@/types';

// =============================================================================
// CurrencyInput — SAR formatting with VAT display
// =============================================================================

export interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  /** Show VAT breakdown below input */
  showVat?: boolean;
  /** Callback with numeric value */
  onValueChange?: (value: number) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, error, hint, showVat, id, onValueChange, onChange, value, ...props }, ref) => {
    const inputId = id || props.name || 'amount';
    const [displayValue, setDisplayValue] = useState<string>(
      value !== undefined ? String(value) : '',
    );

    const numericValue = parseFloat(displayValue.replace(/,/g, '')) || 0;
    const vatAmount = numericValue * VAT_RATE;
    const totalWithVat = numericValue + vatAmount;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d.]/g, '');
      // Prevent multiple decimals
      const parts = raw.split('.');
      const cleaned = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw;
      setDisplayValue(cleaned);

      const numeric = parseFloat(cleaned) || 0;
      onValueChange?.(numeric);
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex h-10 w-full overflow-hidden rounded-lg border border-input',
            'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
            error && 'border-destructive focus-within:outline-destructive',
          )}
        >
          <div className="flex items-center bg-muted px-3 text-sm font-medium text-muted-foreground border-e border-input select-none">
            SAR
          </div>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            dir="ltr"
            placeholder="0.00"
            value={displayValue}
            onChange={handleChange}
            className={cn(
              'flex-1 bg-background px-3 text-sm outline-none',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
        </div>

        {/* VAT breakdown */}
        {showVat && numericValue > 0 && (
          <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
            <span>VAT (15%): {vatAmount.toFixed(2)} SAR</span>
            <span>Total: {totalWithVat.toFixed(2)} SAR</span>
          </div>
        )}

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
