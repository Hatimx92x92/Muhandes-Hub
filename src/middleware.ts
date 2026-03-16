// =============================================================================
// Muqawil HUB — Middleware
// next-intl locale routing + Supabase session refresh + route protection
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// ---------------------------------------------------------------------------
// next-intl middleware instance (handles locale prefix redirect/rewrite)
// ---------------------------------------------------------------------------

const intlMiddleware = createIntlMiddleware(routing);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale handling for API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Run next-intl middleware first (handles locale prefix detection & redirect)
  const intlResponse = intlMiddleware(request);

  // 2. Determine the locale-stripped path for route protection logic
  //    e.g., /ar/dashboard/projects → /dashboard/projects
  const localeMatch = pathname.match(/^\/(ar|en)(\/.*)?$/);
  const locale = localeMatch?.[1] || routing.defaultLocale;
  const strippedPath = localeMatch?.[2] || '/';

  // 3. Create Supabase middleware client (refreshes session)
  const supabase = createMiddlewareClient(request, intlResponse);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---------------------------------------------------------------------------
  // Route protection — operates on locale-stripped path
  // ---------------------------------------------------------------------------

  // Helper: redirect with locale prefix
  const localeRedirect = (path: string, params?: Record<string, string>) => {
    const url = new URL(`/${locale}${path}`, request.url);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return NextResponse.redirect(url);
  };

  // Protected: /dashboard/* requires authentication + active status
  if (strippedPath.startsWith('/dashboard') && !user) {
    return localeRedirect('/login', { redirect: strippedPath });
  }

  // Verification gate routing for authenticated dashboard users
  if (strippedPath.startsWith('/dashboard') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_status, role, tier')
      .eq('id', user.id)
      .single() as { data: { verification_status: string; role: string; tier: string } | null };

    if (profile) {
      const status = profile.verification_status;
      if (status === 'pending_email') {
        return localeRedirect('/verify/email-sent');
      }
      if (status === 'pending_payment') {
        return localeRedirect('/verify/payment');
      }
      if (status === 'pending_documents') {
        return localeRedirect('/verify/documents');
      }
      if (status === 'pending_approval') {
        return localeRedirect('/verify/pending-approval');
      }
      if (status === 'banned') {
        return localeRedirect('/login', { error: 'banned' });
      }
      if (status === 'restricted') {
        return localeRedirect('/login', { error: 'restricted' });
      }
    }
  }

  // Verification pages require authentication but NOT active status
  if (strippedPath.startsWith('/verify') && !user) {
    return localeRedirect('/login');
  }

  // Protected: /admin/* requires authentication + is_admin flag
  if (strippedPath.startsWith('/admin')) {
    if (!user) {
      return localeRedirect('/login', { redirect: strippedPath });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null };

    if (!profile?.is_admin) {
      return localeRedirect('/dashboard');
    }
  }

  // Auth pages: redirect to dashboard if already logged in
  if (
    (strippedPath === '/login' || strippedPath === '/register' || strippedPath === '/forgot-password') &&
    user
  ) {
    return localeRedirect('/dashboard');
  }

  return intlResponse;
}

// ---------------------------------------------------------------------------
// Matcher — run on all non-API, non-static routes
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    // Match all pathnames except api, _next, and files with extensions
    '/((?!api|_next|.*\\..*).*)',
  ],
};
