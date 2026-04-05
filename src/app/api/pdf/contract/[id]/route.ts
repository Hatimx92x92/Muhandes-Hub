// =============================================================================
// API Route — Generate Contract PDF
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ContractPdf } from '@/lib/pdf/contract-pdf';
import QRCode from 'qrcode';

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

  // Fetch contract
  const { data: contract, error } = await db(supabase)
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Verify access (creator or party in deal)
  if (contract.creator_id !== user.id) {
    // Check if user is party in linked deal
    if (contract.deal_id) {
      const { data: deal } = await db(supabase)
        .from('deals')
        .select('buyer_id, seller_id')
        .eq('id', contract.deal_id)
        .single();

      if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Fetch signatures
  const { data: signatures } = await db(supabase)
    .from('contract_signatures')
    .select('name, title, signed_at')
    .eq('contract_id', id)
    .order('created_at', { ascending: true });

  // Generate QR code data URL if qr_uuid exists
  let qrDataUrl: string | undefined;
  if (contract.qr_uuid) {
    qrDataUrl = await QRCode.toDataURL(
      `https://muhandeshub.com/verify/contract/${contract.qr_uuid}`,
      { width: 120, margin: 1 },
    );
  }

  // Generate PDF
  const buffer = await renderToBuffer(
    ContractPdf({
      data: {
        template_type: contract.template_type,
        status: contract.status,
        party_a: contract.party_a || {},
        party_b: contract.party_b || {},
        scope_ar: contract.scope_ar,
        scope_en: contract.scope_en,
        payment_terms_ar: contract.payment_terms_ar,
        payment_terms_en: contract.payment_terms_en,
        timeline: contract.timeline,
        penalties_ar: contract.penalties_ar,
        penalties_en: contract.penalties_en,
        warranty_ar: contract.warranty_ar,
        warranty_en: contract.warranty_en,
        governing_law: contract.governing_law,
        additional_clauses: contract.additional_clauses || [],
        signatures: signatures || [],
        created_at: contract.created_at,
        qr_uuid: contract.qr_uuid,
        qr_data_url: qrDataUrl,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="contract-${id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
