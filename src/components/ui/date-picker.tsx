'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale/ar';
import { enUS } from 'date-fns/locale/en-US';
import { CalendarIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  name: string;
  label?: string;
  error?: string;
  hint?: string;
  defaultValue?: string; // ISO date string: YYYY-MM-DD
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  name,
  label,
  error,
  hint,
  defaultValue,
  placeholder,
  className,
}: DatePickerProps) {
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? arLocale : enUS;

  const [selected, setSelected] = React.useState<Date | undefined>(() => {
    if (!defaultValue) return undefined;
    const d = parse(defaultValue, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : undefined;
  });

  const [open, setOpen] = React.useState(false);

  const inputId = React.useId();
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  // Hidden input for form submission
  const hiddenValue = selected ? format(selected, 'yyyy-MM-dd') : '';

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <input type="hidden" name={name} value={hiddenValue} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={inputId}
              type="button"
              variant="outline"
              aria-invalid={error ? true : undefined}
              aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
              className={cn(
                'w-full justify-start text-start font-normal',
                !selected && 'text-muted-foreground',
                error && 'border-destructive focus-visible:ring-destructive',
              )}
            />
          }
        >
          <CalendarIcon className="me-2 h-4 w-4" />
          {selected
            ? format(selected, 'PPP', { locale: dateLocale })
            : (placeholder || label || '—')}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(day) => {
              setSelected(day ?? undefined);
              setOpen(false);
            }}
            locale={dateLocale}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            classNames={{
              root: 'p-3',
              months: 'flex flex-col sm:flex-row gap-2',
              month: 'flex flex-col gap-4',
              month_caption: 'flex justify-center pt-1 relative items-center text-sm font-medium',
              nav: 'flex items-center gap-1',
              button_previous: cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                'absolute start-1',
              ),
              button_next: cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                'absolute end-1',
              ),
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              week: 'flex w-full mt-2',
              day: cn(
                'h-9 w-9 text-center text-sm p-0 relative',
                'flex items-center justify-center rounded-md',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-within:relative focus-within:z-20',
              ),
              day_button: cn(
                'h-9 w-9 p-0 font-normal',
                'inline-flex items-center justify-center rounded-md text-sm',
                'ring-offset-background transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              ),
              selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              today: 'bg-accent text-accent-foreground',
              outside: 'text-muted-foreground opacity-50',
              disabled: 'text-muted-foreground opacity-50',
            }}
          />
        </PopoverContent>
      </Popover>
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}
