'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { useBreadcrumbOverrides } from '@/components/layout/breadcrumb-provider';
import { segmentConfig } from '@/lib/breadcrumb-config';

// =============================================================================
// BreadcrumbNav — smart pathname→breadcrumb builder
// =============================================================================

/** Locale prefixes to strip from the pathname */
const locales = new Set(['ar', 'en']);

/** Route group patterns to strip */
const routeGroupRegex = /\([^)]+\)/;

interface BreadcrumbNavProps {
  /** Root context: changes the first crumb label + href */
  rootType?: 'dashboard' | 'admin' | 'public';
  className?: string;
}

export function BreadcrumbNav({ rootType = 'dashboard', className }: BreadcrumbNavProps) {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tBreadcrumb = useTranslations('breadcrumb');
  const { overrides } = useBreadcrumbOverrides();

  const items = buildBreadcrumbs(pathname, rootType, overrides, tNav, tBreadcrumb);

  // Don't render if there's only the root crumb (e.g. /dashboard or /admin root)
  if (items.length <= 1) return null;

  return <Breadcrumbs items={items} className={className} />;
}

// =============================================================================
// Build breadcrumb items from pathname
// =============================================================================

function buildBreadcrumbs(
  pathname: string,
  rootType: 'dashboard' | 'admin' | 'public',
  overrides: Record<string, string>,
  tNav: (key: string) => string,
  tBreadcrumb: (key: string) => string,
): BreadcrumbItem[] {
  // Split pathname and clean up
  let segments = pathname.split('/').filter(Boolean);

  // Strip locale prefix if present
  if (segments.length > 0 && locales.has(segments[0])) {
    segments = segments.slice(1);
  }

  // Strip route group segments like (dashboard), (admin), (public)
  segments = segments.filter((s) => !routeGroupRegex.test(s));

  // Build items starting with the root crumb
  const items: BreadcrumbItem[] = [];

  // Root crumb based on context
  const rootConfig = getRootConfig(rootType, tNav, tBreadcrumb);
  items.push(rootConfig);

  // Skip the root segment in the path if it matches
  // e.g. for /dashboard/projects, skip "dashboard" since it's already the root
  const rootSegment = rootType === 'public' ? null : rootType === 'admin' ? 'admin' : 'dashboard';
  let startIndex = 0;
  if (rootSegment && segments[0] === rootSegment) {
    startIndex = 1;
  }

  // Process remaining segments
  let hrefAccumulator = rootSegment ? `/${rootSegment}` : '';

  for (let i = startIndex; i < segments.length; i++) {
    const segment = segments[i];
    hrefAccumulator += `/${segment}`;

    const label = resolveLabel(segment, overrides, tNav, tBreadcrumb);
    const isLast = i === segments.length - 1;

    items.push({
      label,
      href: isLast ? undefined : hrefAccumulator,
    });
  }

  return items;
}

// =============================================================================
// Helpers
// =============================================================================

function getRootConfig(
  rootType: 'dashboard' | 'admin' | 'public',
  tNav: (key: string) => string,
  tBreadcrumb: (key: string) => string,
): BreadcrumbItem {
  switch (rootType) {
    case 'admin':
      return { label: tBreadcrumb('admin'), href: '/admin' };
    case 'public':
      return { label: tBreadcrumb('home'), href: '/' };
    default:
      return { label: tNav('dashboard'), href: '/dashboard' };
  }
}

function resolveLabel(
  segment: string,
  overrides: Record<string, string>,
  tNav: (key: string) => string,
  tBreadcrumb: (key: string) => string,
): string {
  // 1. Check context overrides (dynamic [id] labels)
  if (overrides[segment]) {
    return overrides[segment];
  }

  // 2. Check static config
  const config = segmentConfig[segment];
  if (config) {
    return config.namespace === 'nav' ? tNav(config.key) : tBreadcrumb(config.key);
  }

  // 3. Fallback: capitalize raw segment (for unknown segments / IDs without override)
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
