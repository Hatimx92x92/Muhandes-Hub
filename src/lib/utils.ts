// =============================================================================
// Muqawil HUB — Shared Utility Functions
// =============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


/**
 * Merge Tailwind classes with clsx — deduplicates and resolves conflicts.
 * Usage: cn('px-4 py-2', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as SAR currency (Saudi Riyal).
 * Always VAT-inclusive per ZATCA rules.
 * @example formatSAR(1500) → "1,500.00 SAR" (en) or "١٬٥٠٠٫٠٠ ر.س" (ar)
 */
export function formatSAR(amount: number, locale: string = 'ar'): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format phone number for display.
 * Ensures +966 prefix and groups digits.
 * @example formatPhone('+966512345678') → '+966 51 234 5678'
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('966') && cleaned.length === 12) {
    const local = cleaned.slice(3);
    return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return phone;
}

/**
 * Get the locale-appropriate field value from bilingual DB fields.
 * @example getLocaleField({ title_ar: 'مشروع', title_en: 'Project' }, 'title', 'ar') → 'مشروع'
 */
export function getLocaleField<T extends Record<string, unknown>>(
  record: T,
  field: string,
  locale: string = 'ar',
): string {
  const key = `${field}_${locale}` as keyof T;
  const fallbackKey = `${field}_${locale === 'ar' ? 'en' : 'ar'}` as keyof T;
  return (record[key] as string) || (record[fallbackKey] as string) || '';
}

/**
 * Calculate VAT amount from a net price.
 * Saudi ZATCA VAT rate = 15%.
 */
export function calculateVAT(netAmount: number): number {
  return netAmount * 0.15;
}

/**
 * Calculate gross (VAT-inclusive) price from net amount.
 */
export function netToGross(netAmount: number): number {
  return netAmount * 1.15;
}

/**
 * Calculate net price from a VAT-inclusive amount.
 */
export function grossToNet(grossAmount: number): number {
  return grossAmount / 1.15;
}

/**
 * Generate a slug from text (supports basic Latin characters).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to a given length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Format a date for display in the user's locale.
 */
export function formatDate(
  date: string | Date,
  locale: string = 'ar',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a relative time (e.g., "3 days ago").
 */
export function formatRelativeTime(date: string | Date, locale: string = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    numeric: 'auto',
  });

  if (diffDay > 0) return rtf.format(-diffDay, 'day');
  if (diffHour > 0) return rtf.format(-diffHour, 'hour');
  if (diffMin > 0) return rtf.format(-diffMin, 'minute');
  return rtf.format(-diffSec, 'second');
}

/**
 * Sleep utility for delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
