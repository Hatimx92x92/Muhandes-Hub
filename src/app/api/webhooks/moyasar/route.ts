// =============================================================================
// Muhandes HUB — Moyasar Payment Webhook
// =============================================================================
// POST /api/webhooks/moyasar
// Receives payment confirmations from Moyasar gateway.
// Handles both subscription and commission payments.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { VAT_RATE } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHmac, timingSafeEqual } from 'crypto';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePdf } from '@/lib/pdf/invoice-pdf';

const PLATFORM_INFO = {
  platform_name: 'Muhandes HUB / منصة مهندس',
  platform_vat_number: process.env.PLATFORM_VAT_NUMBER || '300000000000003',
  platform_cr_number: process.env.PLATFORM_CR_NUMBER || '1010000000',
  platform_address: process.env.PLATFORM_ADDRESS || 'Riyadh, Kingdom of Saudi Arabia',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// HMAC Signature Verification
// ---------------------------------------------------------------------------
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.MOYASAR_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(body).digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. Read raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('x-moyasar-signature') ?? '';

  // 2. Verify HMAC signature
  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse payload
  let payload: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      type?: 'subscription' | 'commission';
      action?: 'new' | 'upgrade' | 'renewal';
      subscription_id?: string;
      previous_subscription_id?: string;
      commission_id?: string;
      user_id?: string;
    };
  };

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 4. Only process paid/captured status
  if (payload.status !== 'paid') {
    return NextResponse.json({ received: true, status: payload.status });
  }

  const supabase = createAdminClient();
  const metadata = payload.metadata;

  if (!metadata?.type) {
    return NextResponse.json({ error: 'Missing payment type in metadata' }, { status: 400 });
  }

  // 5. Idempotency check — avoid double processing
  const { data: existingInvoice } = await db(supabase)
    .from('invoices')
    .select('id')
    .eq('moyasar_payment_id', payload.id)
    .maybeSingle();

  if (existingInvoice) {
    return NextResponse.json({ received: true, message: 'Already processed' });
  }

  // 6. Process by payment type
  if (metadata.type === 'subscription' && metadata.subscription_id) {
    return handleSubscriptionPayment(supabase, payload, metadata.subscription_id, metadata);
  }

  if (metadata.type === 'commission' && metadata.commission_id) {
    return handleCommissionPayment(supabase, payload, metadata.commission_id);
  }

  return NextResponse.json({ error: 'Unknown payment type' }, { status: 400 });
}

// ---------------------------------------------------------------------------
// Handle Subscription Payment
// ---------------------------------------------------------------------------
async function handleSubscriptionPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  payload: { id: string; amount: number },
  subscriptionId: string,
  metadata: { action?: string; previous_subscription_id?: string },
) {
  // Fetch subscription
  const { data: subscription, error } = await db(supabase)
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (error || !subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  // Calculate expiry from the subscription's own duration (not hardcoded)
  const now = new Date();
  const durationMonths = (subscription.duration_months as number) || 12;
  const startsAt = subscription.starts_at ? new Date(subscription.starts_at as string) : now;
  const endDate = new Date(startsAt);
  endDate.setMonth(endDate.getMonth() + durationMonths);

  // For upgrades: deactivate the previous subscription
  if (metadata.action === 'upgrade' && metadata.previous_subscription_id) {
    await db(supabase)
      .from('subscriptions')
      .update({ is_active: false, status: 'superseded' })
      .eq('id', metadata.previous_subscription_id);
  }

  // Activate new subscription
  await db(supabase)
    .from('subscriptions')
    .update({
      status: 'active',
      is_active: true,
      started_at: now.toISOString(),
      expires_at: endDate.toISOString(),
      moyasar_payment_id: payload.id,
    })
    .eq('id', subscriptionId);

  // Update profile tier
  await db(supabase)
    .from('profiles')
    .update({
      subscription_tier: subscription.tier,
      subscription_expires_at: endDate.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscription.user_id);

  // Create invoice
  const amountSAR = payload.amount / 100; // Moyasar amounts are in halalas
  const vat = amountSAR * VAT_RATE;

  await db(supabase).from('invoices').insert({
    user_id: subscription.user_id,
    type: 'subscription',
    reference_id: subscriptionId,
    subtotal: amountSAR - vat,
    vat,
    total: amountSAR,
    moyasar_payment_id: payload.id,
    issued_at: now.toISOString(),
  });

  // If user is in pending_payment gate, advance their verification status
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('verification_status')
    .eq('id', subscription.user_id)
    .single();

  if (profile?.verification_status === 'pending_payment') {
    await db(supabase)
      .from('profiles')
      .update({ verification_status: 'pending_documents' })
      .eq('id', subscription.user_id);
  }

  // Send notification
  try {
    const { notifySubscriptionUpgraded, notifySubscriptionRenewed } = await import('@/actions/notification-triggers');
    if (metadata.action === 'upgrade') {
      await notifySubscriptionUpgraded({ userId: subscription.user_id as string, newTier: subscription.tier as string });
    } else {
      await notifySubscriptionRenewed({ userId: subscription.user_id as string, tier: subscription.tier as string });
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ received: true, action: metadata.action || 'subscription_activated' });
}

// ---------------------------------------------------------------------------
// Handle Commission Payment
// ---------------------------------------------------------------------------
async function handleCommissionPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  payload: { id: string; amount: number },
  commissionId: string,
) {
  // Fetch commission
  const { data: commission, error } = await db(supabase)
    .from('commissions')
    .select('*')
    .eq('id', commissionId)
    .single();

  if (error || !commission) {
    return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
  }

  // Mark commission as paid
  await db(supabase)
    .from('commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'card',
      moyasar_payment_id: payload.id,
    })
    .eq('id', commissionId);

  // Create invoice record
  const now = new Date().toISOString();
  await db(supabase).from('invoices').insert({
    user_id: commission.seller_id,
    type: 'commission',
    reference_id: commissionId,
    subtotal: commission.amount,
    vat: commission.vat_amount,
    total: commission.total,
    moyasar_payment_id: payload.id,
    issued_at: now,
  });

  // Generate ZATCA-compliant PDF invoice and store it
  void (async () => {
    try {
      const [sellerResult, dealResult] = await Promise.all([
        db(supabase).from('profiles').select('company_name_ar, company_name_en, vat_number, cr_number, city').eq('id', commission.seller_id).single(),
        db(supabase).from('deals').select('id, title_slug, value').eq('id', commission.deal_id).single(),
      ]);
      const seller = sellerResult.data;
      const deal = dealResult.data;

      const buffer = await renderToBuffer(
        InvoicePdf({
          data: {
            invoice_number: `INV-${commissionId.slice(0, 8).toUpperCase()}`,
            deal_id: commission.deal_id,
            deal_title: deal?.title_slug || undefined,
            seller_company: seller?.company_name_ar || seller?.company_name_en || undefined,
            seller_vat_number: seller?.vat_number || undefined,
            seller_cr_number: seller?.cr_number || undefined,
            seller_address: seller?.city || undefined,
            ...PLATFORM_INFO,
            deal_value: Number(deal?.value) || 0,
            commission_rate: Number(commission.rate) / 100,
            net_amount: Number(commission.amount) || 0,
            vat_amount: Number(commission.vat_amount) || 0,
            total: Number(commission.total) || 0,
            issue_date: now,
            due_date: commission.due_date,
            status: 'paid',
            paid_at: now,
          },
        }),
      );

      await supabase.storage
        .from('invoices')
        .upload(`commission-${commissionId}.pdf`, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
    } catch { /* non-critical — PDF available on demand via /api/pdf/invoice */ }
  })();

  return NextResponse.json({ received: true, action: 'commission_paid' });
}
