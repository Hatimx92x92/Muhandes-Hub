'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Saudi Cities — static list (matches DB seed data)
// =============================================================================

export const SAUDI_CITIES = [
  { value: 'riyadh', label_en: 'Riyadh', label_ar: 'الرياض' },
  { value: 'jeddah', label_en: 'Jeddah', label_ar: 'جدة' },
  { value: 'mecca', label_en: 'Mecca', label_ar: 'مكة المكرمة' },
  { value: 'medina', label_en: 'Medina', label_ar: 'المدينة المنورة' },
  { value: 'dammam', label_en: 'Dammam', label_ar: 'الدمام' },
  { value: 'khobar', label_en: 'Khobar', label_ar: 'الخبر' },
  { value: 'dhahran', label_en: 'Dhahran', label_ar: 'الظهران' },
  { value: 'tabuk', label_en: 'Tabuk', label_ar: 'تبوك' },
  { value: 'abha', label_en: 'Abha', label_ar: 'أبها' },
  { value: 'taif', label_en: 'Taif', label_ar: 'الطائف' },
  { value: 'buraidah', label_en: 'Buraidah', label_ar: 'بريدة' },
  { value: 'hail', label_en: 'Hail', label_ar: 'حائل' },
  { value: 'najran', label_en: 'Najran', label_ar: 'نجران' },
  { value: 'jizan', label_en: 'Jizan', label_ar: 'جازان' },
  { value: 'yanbu', label_en: 'Yanbu', label_ar: 'ينبع' },
  { value: 'khamis_mushait', label_en: 'Khamis Mushait', label_ar: 'خميس مشيط' },
  { value: 'al_ahsa', label_en: 'Al Ahsa', label_ar: 'الأحساء' },
  { value: 'jubail', label_en: 'Jubail', label_ar: 'الجبيل' },
  { value: 'arar', label_en: 'Arar', label_ar: 'عرعر' },
  { value: 'sakaka', label_en: 'Sakaka', label_ar: 'سكاكا' },
  { value: 'baha', label_en: 'Al Baha', label_ar: 'الباحة' },
  { value: 'qatif', label_en: 'Qatif', label_ar: 'القطيف' },
  { value: 'neom', label_en: 'NEOM', label_ar: 'نيوم' },
] as const;

// =============================================================================
// Types
// =============================================================================

export interface CitySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  /** Current locale for display */
  locale?: 'ar' | 'en';
  /** Placeholder text */
  placeholder?: string;
}

// =============================================================================
// Component
// =============================================================================

const CitySelect = forwardRef<HTMLSelectElement, CitySelectProps>(
  ({ className, label, error, hint, id, locale = 'ar', placeholder, ...props }, ref) => {
    const selectId = id || props.name || 'city';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:outline-destructive',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {SAUDI_CITIES.map((city) => (
            <option key={city.value} value={city.value}>
              {locale === 'ar' ? city.label_ar : city.label_en}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${selectId}-hint`} className="mt-1 text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

CitySelect.displayName = 'CitySelect';

export { CitySelect };
