// =============================================================================
// API Route — Generate ZATCA-Compliant Invoice PDF (Subscription + Commission)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePdf } from '@/lib/pdf/invoice-pdf';
import { SubscriptionInvoicePdf } from '@/lib/pdf/subscription-invoice-pdf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

// Platform billing info (from environment or hardcoded for now)
const PLATFORM_INFO = {
  platform_name: 'Muhandes HUB / منصة مهندس',
  platform_vat_number: process.env.PLATFORM_VAT_NUMBER || '300000000000003',
  platform_cr_number: process.env.PLATFORM_CR_NUMBER || '1010000000',
  platform_address: process.env.PLATFORM_ADDRESS || 'Riyadh, Kingdom of Saudi Arabia',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try to find the invoice record first
  const { data: invoice } = await db(supabase)
    .from('invoices')
    .select('id, type, number, reference_id, subtotal, vat, total, issued_at, user_id')
    .eq('id', id)
    .single();

  // If found in invoices table, route by type
  if (invoice) {
    if (invoice.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (invoice.type === 'subscription') {
      return generateSubscriptionInvoicePdf(supabase, invoice, user.id);
    }

    // Commission invoice — look up commission by reference_id
    return generateCommissionInvoicePdf(supabase, invoice.reference_id, user.id, invoice.number);
  }

  // Backward compat: treat ID as a commission ID (existing commission page links)
  return generateCommissionInvoicePdf(supabase, id, user.id);
}

// ---------------------------------------------------------------------------
// Commission invoice PDF (existing behavior)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateCommissionInvoicePdf(supabase: any, commissionId: string, userId: string, invoiceNumber?: string) {
  const { data: commission, error } = await db(supabase)
    .from('commissions')
    .select('*')
    .eq('id', commissionId)
    .single();

  if (error || !commission) {
    return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
  }

  if (commission.seller_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: seller } = await db(supabase)
    .from('profiles')
    .select('company_name_ar, company_name_en, vat_number, cr_number, city')
    .eq('id', commission.seller_id)
    .single();

  const { data: deal } = await db(supabase)
    .from('deals')
    .select('id, title_slug, value')
    .eq('id', commission.deal_id)
    .single();

  const buffer = await renderToBuffer(
    InvoicePdf({
      data: {
        invoice_number: invoiceNumber || `INV-${commissionId.slice(0, 8).toUpperCase()}`,
        deal_id: commission.deal_id,
        deal_title: deal?.title_slug || undefined,
        seller_company: seller?.company_name_ar || seller?.company_name_en || undefined,
        seller_vat_number: seller?.vat_number || undefined,
        seller_cr_number: seller?.cr_number || undefined,
        seller_address: seller?.city || undefined,
        ...PLATFORM_INFO,
        deal_value: Number(deal?.value) || 0,
        commission_rate: Number(commission.rate) || 0,
        net_amount: Number(commission.net_amount) || 0,
        vat_amount: Number(commission.vat_amount) || 0,
        total: Number(commission.total) || 0,
        issue_date: commission.created_at,
        due_date: commission.due_date,
        status: commission.status,
        paid_at: commission.paid_at || undefined,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${commissionId.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}

// ---------------------------------------------------------------------------
// Subscription invoice PDF
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateSubscriptionInvoicePdf(supabase: any, invoice: any, userId: string) {
  // Fetch subscription details
  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier, duration_months, starts_at, expires_at, payment_method')
    .eq('id', invoice.reference_id)
    .single();

  // Fetch user profile
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('company_name_ar, company_name_en, vat_number, cr_number, city')
    .eq('id', userId)
    .single();

  const buffer = await renderToBuffer(
    SubscriptionInvoicePdf({
      data: {
        invoice_number: invoice.number || `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
        subscriber_name: profile?.company_name_ar || profile?.company_name_en || undefined,
        subscriber_vat_number: profile?.vat_number || undefined,
        subscriber_cr_number: profile?.cr_number || undefined,
        subscriber_address: profile?.city || undefined,
        ...PLATFORM_INFO,
        tier: subscription?.tier || 'unknown',
        duration_months: Number(subscription?.duration_months) || 1,
        subtotal: Number(invoice.subtotal) || 0,
        vat_amount: Number(invoice.vat) || 0,
        total: Number(invoice.total) || 0,
        issue_date: invoice.issued_at,
        period_start: subscription?.starts_at || undefined,
        period_end: subscription?.expires_at || undefined,
        payment_method: subscription?.payment_method || undefined,
        paid_at: invoice.issued_at,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${invoice.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
