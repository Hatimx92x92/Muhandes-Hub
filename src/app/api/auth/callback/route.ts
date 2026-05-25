import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// =============================================================================
// Auth Callback — code exchange (PKCE) + OTP verify (token_hash) + redirect
// Handles: Google OAuth callback, email verification redirect, password reset
// =============================================================================

/** Helper: create redirect with session token cookie (single-device enforcement) */
function redirectWithSessionToken(url: URL, token: string) {
  const res = NextResponse.redirect(url);
  res.cookies.set('mh_session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'magiclink' | null;
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();
  let authError: Error | null = null;

  // Dual-mode: handle both PKCE (code) and OTP (token_hash + type) verification
  if (tokenHash && type) {
    // OTP / magic-link / email verification via token_hash
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    authError = error;
  } else if (code) {
    // PKCE flow — exchange authorization code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else {
    // No auth params at all
    return NextResponse.redirect(new URL('/login?error=auth', origin));
  }

  if (!authError) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: profile } = await db
        .from('profiles')
        .select('role, verification_status, provider, phone')
        .eq('id', user.id)
        .single();

      // New Google user without a profile → redirect to register to pick a role
      // Also catch users whose profile was auto-created by the DB trigger but
      // never completed registration (phone is empty until wizard is submitted)
      const isIncompleteGoogleUser =
        user.app_metadata?.provider === 'google' &&
        !profile?.phone;

      if (!profile || isIncompleteGoogleUser) {
        const oauthName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
        return NextResponse.redirect(
          new URL(`/register?oauth=google&email=${encodeURIComponent(user.email ?? '')}&name=${encodeURIComponent(oauthName)}`, origin),
        );
      }

      // Single-device enforcement: generate session token and store in DB
      const sessionToken = crypto.randomUUID();
      await db
        .from('profiles')
        .update({ active_session_token: sessionToken })
        .eq('id', user.id);

      // Gate 1: Email verified — advance from pending_email
      if (profile.verification_status === 'pending_email') {
        const role = profile.role as string;

        // Get tier from active subscription
        const { data: sub } = await db
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        const tier = (sub?.tier as string) || 'starter';
        const isPro = (role === 'contractor' || role === 'supplier') && tier !== 'starter';

        // PO / Buyer / Starter → active immediately
        // Pro+ → advance to pending_payment
        const nextStatus = isPro ? 'pending_payment' : 'active';

        await db
          .from('profiles')
          .update({ verification_status: nextStatus })
          .eq('id', user.id);

        if (isPro) {
          return redirectWithSessionToken(new URL('/verify/payment', origin), sessionToken);
        }
      }

      // Route users still in verification gates
      const status = profile.verification_status as string;
      if (status === 'pending_payment') {
        return redirectWithSessionToken(new URL('/verify/payment', origin), sessionToken);
      }
      if (status === 'pending_documents') {
        return redirectWithSessionToken(new URL('/verify/documents', origin), sessionToken);
      }
      if (status === 'pending_approval') {
        return redirectWithSessionToken(new URL('/verify/pending-approval', origin), sessionToken);
      }

      // Active user — redirect to next with session token
      return redirectWithSessionToken(new URL(next, origin), sessionToken);
    }

    // No user found (e.g. password reset without profile) — redirect to next
    return NextResponse.redirect(new URL(next, origin));
  }

  // Auth code error → go to login with error
  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
