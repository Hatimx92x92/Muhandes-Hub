import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import {
  VerificationProgress,
  type VerifyStep,
} from '@/components/features/verify/verification-progress';

// =============================================================================
// Verification Gates Layout — minimal centered layout with progress stepper
// =============================================================================

// Status → step index mapping for the 4-gate flow
const STATUS_INDEX: Record<string, number> = {
  pending_email: 0,
  pending_payment: 1,
  pending_documents: 2,
  pending_approval: 3,
  active: 4, // all completed
};

export default async function VerifyLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let steps: VerifyStep[] = [];
  let currentIndex = 0;

  if (user) {
    const t = await getTranslations('verify.stepper');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile } = await db
      .from('profiles')
      .select('verification_status, role')
      .eq('id', user.id)
      .single();

    // Check if user has a paid tier subscription
    const { data: sub } = await db
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const tier = sub?.tier || 'starter';
    const role = profile?.role as string;
    const status = (profile?.verification_status as string) || 'pending_email';
    const isPaidTier = tier !== 'starter';
    const needsFullFlow = isPaidTier && (role === 'contractor' || role === 'supplier');

    if (needsFullFlow) {
      steps = [
        { key: 'email', label: t('email') },
        { key: 'payment', label: t('payment') },
        { key: 'documents', label: t('documents') },
        { key: 'review', label: t('review') },
      ];
      currentIndex = STATUS_INDEX[status] ?? 0;
    }
    // Single-gate flows (PO, buyer, starter tier) — no stepper (steps remains empty)
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <VerificationProgress steps={steps} currentIndex={currentIndex} />
        {children}
      </div>
    </div>
  );
}
