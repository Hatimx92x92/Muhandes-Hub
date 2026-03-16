import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// FormField — label + input + error message wrapper
// =============================================================================

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** HTML name attribute for the input (used for htmlFor) */
  name?: string;
  /** Optional sublabel / hint text */
  hint?: string;
  /** Error message string */
  error?: string;
  /** Whether the field is required (shows asterisk) */
  required?: boolean;
  /** The form input element */
  children: ReactNode;
  /** Optional className for the wrapper */
  className?: string;
}

export function FormField({
  label,
  name,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </label>

      {children}

      {error && (
        <p
          id={name ? `${name}-error` : undefined}
          className="mt-1 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {!error && hint && (
        <p
          id={name ? `${name}-hint` : undefined}
          className="mt-1 text-sm text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
