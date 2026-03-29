// =============================================================================
// Muhandes HUB — Shared Utility Functions
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
 * Generate a URL-safe slug from text. Supports Arabic, Latin, and other Unicode scripts.
 * @example slugify('مشروع بناء') → 'مشروع-بناء'
 * @example slugify('Building Project') → 'building-project'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * UUID v4 regex pattern for detecting ID-based URLs.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a UUID.
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Get the locale-appropriate slug from a record with slug_ar / slug_en fields.
 * Falls back to the other locale's slug if the preferred one is empty.
 */
export function getEntitySlug(
  record: { slug_ar?: string | null; slug_en?: string | null; title_slug?: string | null },
  locale: string = 'ar',
): string {
  if ('title_slug' in record && record.title_slug) return record.title_slug;
  const primary = locale === 'ar' ? record.slug_ar : record.slug_en;
  const fallback = locale === 'ar' ? record.slug_en : record.slug_ar;
  return primary || fallback || '';
}

/**
 * Generate a unique slug by checking for collisions in the database.
 * Appends -2, -3, etc. if the base slug already exists.
 * @param text - The text to slugify
 * @param table - Supabase table name
 * @param column - Slug column name (e.g. 'slug_ar')
 * @param supabase - Supabase client instance
 * @param excludeId - Exclude this record's ID from collision check (for updates)
 */
export async function generateUniqueSlug(
  text: string,
  table: string,
  column: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  excludeId?: string,
): Promise<string> {
  const base = slugify(text);
  if (!base) return '';

  let candidate = base;
  let counter = 1;

  while (true) {
    let query = supabase.from(table).select('id').eq(column, candidate).limit(1);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    counter++;
    candidate = `${base}-${counter}`;
  }
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
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a relative time (e.g., "3 days ago").
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = 'ar',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-SA', {
    numeric: 'auto',
  });

  if (diffSecs < 60) return rtf.format(-diffSecs, 'second');
  if (diffMins < 60) return rtf.format(-diffMins, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  if (diffDays < 30) return rtf.format(-diffDays, 'day');
  if (diffDays < 365) return rtf.format(-Math.round(diffDays / 30), 'month');
  return rtf.format(-Math.round(diffDays / 365), 'year');
}

/**
 * Async sleep utility.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
