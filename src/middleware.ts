// =============================================================================
// Muhandes HUB — Middleware
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

  // Catch PKCE authorization codes that land on non-API routes
  // (happens when Supabase Site URL redirect is used instead of /api/auth/callback)
  const code = request.nextUrl.searchParams.get('code');
  if (code && !pathname.startsWith('/api/')) {
    const callbackUrl = new URL('/api/auth/callback', request.url);
    callbackUrl.searchParams.set('code', code);
    return NextResponse.redirect(callbackUrl);
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

  // Helper: redirect with locale prefix (copies cookies from intlResponse)
  const localeRedirect = (path: string, params?: Record<string, string>) => {
    const url = new URL(`/${locale}${path}`, request.url);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    const res = NextResponse.redirect(url);
    // Propagate cookies (e.g. session refresh / signOut) from intlResponse
    for (const cookie of intlResponse.cookies.getAll()) {
      res.cookies.set(cookie);
    }
    return res;
  };

  // Helper: sign out user and redirect (single-device enforcement)
  const forceSignOut = async (reason: string) => {
    await supabase.auth.signOut();
    const res = localeRedirect('/login', { reason });
    res.cookies.set('mh_session_token', '', { maxAge: 0, path: '/' });
    return res;
  };

  // Protected: /dashboard/* requires authentication + active status
  if (strippedPath.startsWith('/dashboard') && !user) {
    return localeRedirect('/login', { redirect: strippedPath });
  }

  // Verification gate routing for authenticated dashboard users
  if (strippedPath.startsWith('/dashboard') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_status, role, is_admin, active_session_token, provider, phone')
      .eq('id', user.id)
      .single() as { data: { verification_status: string; role: string; is_admin: boolean; active_session_token: string | null; provider: string | null; phone: string | null } | null };

    // Incomplete Google user (trigger-created profile, never completed registration)
    // → redirect to register wizard to finish role selection, phone, company info, etc.
    if (
      user.app_metadata?.provider === 'google' &&
      !profile?.phone
    ) {
      const email = user.email ?? '';
      return localeRedirect('/register', { oauth: 'google', email });
    }

    // Single-device enforcement: compare cookie token with DB token
    if (profile?.active_session_token) {
      const cookieToken = request.cookies.get('mh_session_token')?.value;
      if (cookieToken !== profile.active_session_token) {
        return forceSignOut('session_replaced');
      }
    }

    // Admin users should only use /admin/* — redirect away from /dashboard
    if (profile?.is_admin) {
      return localeRedirect('/admin');
    }

    if (profile) {
      const status = profile.verification_status;
      if (
        status === 'pending_email' ||
        status === 'pending_payment' ||
        status === 'pending_documents' ||
        status === 'pending_approval'
      ) {
        // Preserve the original destination so we can redirect back after verification
        const verifyRedirectRes = localeRedirect(
          status === 'pending_email'
            ? '/verify/email-sent'
            : status === 'pending_payment'
              ? '/verify/payment'
              : status === 'pending_documents'
                ? '/verify/documents'
                : '/verify/pending-approval',
        );
        verifyRedirectRes.cookies.set('mh_verify_redirect', strippedPath, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          sameSite: 'lax',
        });
        return verifyRedirectRes;
      }
      if (status === 'banned') {
        return localeRedirect('/login', { error: 'banned' });
      }
      // Restricted users can access dashboard with limited actions
      // (enforced at server action level, not middleware)
    }
  }

  // Verification pages require authentication but NOT active status
  // Exception: /verify/email-sent is accessible without auth (no session after signUp)
  if (strippedPath.startsWith('/verify') && strippedPath !== '/verify/email-sent' && !user) {
    return localeRedirect('/login');
  }

  // If a verified (active/restricted) user lands on /verify/*, redirect them away
  // (e.g. after completing all gates, or bookmarked a verify URL)
  if (strippedPath.startsWith('/verify') && strippedPath !== '/verify/email-sent' && user) {
    const { data: vProfile } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', user.id)
      .single() as { data: { verification_status: string } | null };

    if (vProfile && (vProfile.verification_status === 'active' || vProfile.verification_status === 'restricted')) {
      const savedRedirect = request.cookies.get('mh_verify_redirect')?.value;
      const target = savedRedirect || '/dashboard';
      const res = localeRedirect(target);
      res.cookies.set('mh_verify_redirect', '', { maxAge: 0, path: '/' });
      return res;
    }
  }

  // Protected: /admin/* requires authentication + is_admin flag
  if (strippedPath.startsWith('/admin')) {
    if (!user) {
      return localeRedirect('/login', { redirect: strippedPath });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, active_session_token')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean; active_session_token: string | null } | null };

    // Single-device enforcement for admin routes
    if (profile?.active_session_token) {
      const cookieToken = request.cookies.get('mh_session_token')?.value;
      if (cookieToken !== profile.active_session_token) {
        return forceSignOut('session_replaced');
      }
    }

    if (!profile?.is_admin) {
      return localeRedirect('/dashboard');
    }
  }

  // Auth pages: redirect to dashboard/admin if already logged in
  if (
    (strippedPath === '/login' || strippedPath === '/register' || strippedPath === '/forgot-password') &&
    user
  ) {
    // Allow incomplete Google users to stay on /register to finish onboarding
    if (strippedPath === '/register' && user.app_metadata?.provider === 'google') {
      const { data: regProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single() as { data: { phone: string | null } | null };

      if (!regProfile?.phone) {
        return intlResponse;
      }
    }

    // Check if admin — redirect to admin panel instead of dashboard
    const { data: authProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null };

    if (authProfile?.is_admin) {
      return localeRedirect('/admin');
    }
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
