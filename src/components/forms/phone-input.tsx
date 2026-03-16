'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// PhoneInput — locked +966 prefix with 9-digit validation
// =============================================================================

export interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength'> {
  label?: string;
  error?: string;
  hint?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name || 'phone';

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
          {/* Fixed prefix */}
          <div className="flex items-center bg-muted px-3 text-sm font-medium text-muted-foreground border-e border-input select-none" dir="ltr">
            +966
          </div>
          {/* Number input */}
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            maxLength={9}
            dir="ltr"
            placeholder="5XXXXXXXX"
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

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
