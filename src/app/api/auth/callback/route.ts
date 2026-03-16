import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// OAuth Callback — code exchange + redirect
// Handles: Google OAuth callback, email verification redirect, password reset
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;

        const { data: profile } = await db
          .from('profiles')
          .select('role, verification_status, tier')
          .eq('id', user.id)
          .single();

        // New Google user without a profile → redirect to register to pick a role
        if (!profile) {
          return NextResponse.redirect(
            new URL(`/register?oauth=google&email=${encodeURIComponent(user.email ?? '')}`, origin),
          );
        }

        // Gate 1: Email verified — advance from pending_email
        if (profile.verification_status === 'pending_email') {
          const role = profile.role as string;
          const tier = profile.tier as string;
          const isPro = (role === 'contractor' || role === 'supplier') && tier !== 'starter';

          // PO / Buyer / Starter → active immediately
          // Pro+ → advance to pending_payment
          const nextStatus = isPro ? 'pending_payment' : 'active';

          await db
            .from('profiles')
            .update({ verification_status: nextStatus })
            .eq('id', user.id);

          if (isPro) {
            return NextResponse.redirect(new URL('/verify/payment', origin));
          }
        }

        // Route users still in verification gates
        const status = profile.verification_status as string;
        if (status === 'pending_payment') {
          return NextResponse.redirect(new URL('/verify/payment', origin));
        }
        if (status === 'pending_documents') {
          return NextResponse.redirect(new URL('/verify/documents', origin));
        }
        if (status === 'pending_approval') {
          return NextResponse.redirect(new URL('/verify/pending-approval', origin));
        }
      }

      // Active user or password reset → redirect to next
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Auth code error → go to login with error
  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
