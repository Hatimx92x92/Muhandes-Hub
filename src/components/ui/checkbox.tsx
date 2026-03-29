'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Minus } from 'lucide-react';

// =============================================================================
// Checkbox — Accessible checkbox with indeterminate support
// =============================================================================

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, indeterminate = false, onCheckedChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current!);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const isChecked = indeterminate || checked;

    return (
      <label
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        className={cn(
          'inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors',
          isChecked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background hover:border-primary/50',
          className,
        )}
      >
        <input
          ref={innerRef}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : checked ? (
          <Check className="h-3 w-3" />
        ) : null}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
