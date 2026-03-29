// =============================================================================
// API Route — Generate Quotation PDF
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotationPdf } from '@/lib/pdf/quotation-pdf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

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

  // Fetch quotation
  const { data: quotation, error } = await db(supabase)
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }

  // Verify access (sender or recipient only)
  if (quotation.sender_id !== user.id && quotation.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch sender company name
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('company_name_ar, company_name_en')
    .eq('id', quotation.sender_id)
    .single();

  // Generate PDF
  const buffer = await renderToBuffer(
    QuotationPdf({
      data: {
        number: quotation.number as string,
        status: quotation.status as string,
        client_name: quotation.client_name as string | undefined,
        project_ref: quotation.project_ref as string | undefined,
        validity_days: (quotation.validity_days as number) || 2,
        line_items: (quotation.line_items as Array<{ description: string; quantity: number; unit: string; unit_price: number; total?: number }>) || [],
        subtotal: Number(quotation.subtotal) || 0,
        vat_amount: Number(quotation.vat_amount) || 0,
        total: Number(quotation.total) || 0,
        payment_terms_ar: quotation.payment_terms_ar as string | undefined,
        payment_terms_en: quotation.payment_terms_en as string | undefined,
        delivery_terms_ar: quotation.delivery_terms_ar as string | undefined,
        delivery_terms_en: quotation.delivery_terms_en as string | undefined,
        notes_ar: quotation.notes_ar as string | undefined,
        notes_en: quotation.notes_en as string | undefined,
        created_at: quotation.created_at as string,
        sender_company: (profile?.company_name_ar || profile?.company_name_en) as string | undefined,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quotation-${quotation.number}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
