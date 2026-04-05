// =============================================================================
// Muhandes HUB â€” Quotation Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizeFieldErrors } from '@/lib/zod-i18n';
import { createClient } from '@/lib/supabase/server';
import { QuotationSchema } from '@/schemas/quotation';
import { apiLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';
import { TIER_LIMITS, VAT_RATE } from '@/types';
import {
  notifyQuotationReceived,
  notifyQuotationAccepted,
  notifyDealCreated,
} from '@/actions/notification-triggers';
import { autoLinkClient } from '@/actions/crm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

async function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Promise<Record<string, string[]>> {
  const locale = await getLocale();
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return localizeFieldErrors(fieldErrors, locale);
}

// Commission rates
const COMMISSION_RATES: Record<string, number> = {
  starter: 0.02,
  pro: 0.01,
  business: 0,
  enterprise: 0,
};

// ---------------------------------------------------------------------------
// CREATE QUOTATION
// ---------------------------------------------------------------------------
export async function createQuotation(
  _prevState: ActionResult<{ id: string; quotation_number: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; quotation_number: string }>> {
  const t = await getTranslations('actions.quotations');
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 1b. Rate limit
  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // 2. Role check â€” contractor or supplier
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role, company_name_ar')
    .eq('id', user.id)
    .single();

  if (!profile || !['contractor', 'supplier'].includes(profile.role)) {
    return { data: null, error: t('onlyContractorsSuppliers') };
  }

  // 3. Tier limit check (monthly quotation count)
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const monthlyLimit = TIER_LIMITS[tier]?.quotationsPerMonth ?? 3;

  if (monthlyLimit !== Infinity) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await db(supabase)
      .from('quotations')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if ((count ?? 0) >= monthlyLimit) {
      return { data: null, error: t('monthlyLimitReached', { limit: monthlyLimit }) };
    }
  }

  // 4. Parse form data
  let lineItems;
  try {
    lineItems = JSON.parse(formData.get('line_items') as string || '[]');
  } catch {
    return { data: null, error: t('invalidLineItems') };
  }

  const raw = {
    mode: formData.get('mode') || 'standalone',
    recipient_id: formData.get('recipient_id') || undefined,
    inquiry_id: formData.get('inquiry_id') || undefined,
    rfq_response_id: formData.get('rfq_response_id') || undefined,
    hire_request_id: formData.get('hire_request_id') || undefined,
    client_name: formData.get('client_name') || undefined,
    project_ref: formData.get('project_ref') || undefined,
    line_items: lineItems,
    validity_days: formData.get('validity_days') || 2,
    payment_terms_ar: formData.get('payment_terms_ar') || undefined,
    payment_terms_en: formData.get('payment_terms_en') || undefined,
    delivery_terms_ar: formData.get('delivery_terms_ar') || undefined,
    delivery_terms_en: formData.get('delivery_terms_en') || undefined,
    notes_ar: formData.get('notes_ar') || undefined,
    notes_en: formData.get('notes_en') || undefined,
  };

  // 5. Validate
  const parsed = QuotationSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // 6. Calculate totals
  const items = parsed.data.line_items.map((item) => ({
    ...item,
    total: item.quantity * item.unit_price,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = subtotal * VAT_RATE; // ZATCA 15%
  const total = subtotal + vatAmount;

  // 7. Auto-generate quotation number (QTN-YYYY-NNNN)
  const year = new Date().getFullYear();
  const { count: existingCount } = await db(supabase)
    .from('quotations')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .gte('created_at', `${year}-01-01T00:00:00Z`);

  const seqNum = ((existingCount ?? 0) + 1).toString().padStart(4, '0');
  const quotationNumber = `QTN-${year}-${seqNum}`;

  // 8. Insert quotation
  const { data: quotation, error } = await db(supabase)
    .from('quotations')
    .insert({
      sender_id: user.id,
      recipient_id: parsed.data.recipient_id || null,
      mode: parsed.data.mode,
      number: quotationNumber,
      inquiry_id: parsed.data.inquiry_id || null,
      rfq_response_id: parsed.data.rfq_response_id || null,
      hire_request_id: parsed.data.hire_request_id || null,
      client_name: parsed.data.client_name || null,
      project_ref: parsed.data.project_ref || null,
      line_items: items,
      subtotal,
      vat_amount: vatAmount,
      total,
      validity_days: parsed.data.validity_days,
      payment_terms_ar: parsed.data.payment_terms_ar || null,
      payment_terms_en: parsed.data.payment_terms_en || null,
      delivery_terms_ar: parsed.data.delivery_terms_ar || null,
      delivery_terms_en: parsed.data.delivery_terms_en || null,
      notes_ar: parsed.data.notes_ar || null,
      notes_en: parsed.data.notes_en || null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !quotation) {
    return { data: null, error: t('createError') };
  }

  revalidatePath('/dashboard/quotations');
  return { data: { id: quotation.id, quotation_number: quotationNumber }, error: null };
}

// ---------------------------------------------------------------------------
// SEND QUOTATION
// ---------------------------------------------------------------------------
export async function sendQuotation(quotationId: string): Promise<ActionResult<{ sent: boolean }>> {
  const t = await getTranslations('actions.quotations');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: quotation } = await db(supabase)
    .from('quotations')
    .select('id, sender_id, status, recipient_id')
    .eq('id', quotationId)
    .single();

  if (!quotation || quotation.sender_id !== user.id) {
    return { data: null, error: t('quotationNotFound') };
  }

  if (quotation.status !== 'draft') {
    return { data: null, error: t('cannotSendInThisStatus') };
  }

  const { error } = await db(supabase)
    .from('quotations')
    .update({ status: 'sent' })
    .eq('id', quotationId);

  if (error) return { data: null, error: t('genericError') };

  // Notify recipient
  if (quotation.recipient_id) {
    const { data: senderProfile } = await db(supabase)
      .from('profiles')
      .select('company_name_ar')
      .eq('id', user.id)
      .single();

    const { data: qtnDetail } = await db(supabase)
      .from('quotations')
      .select('number')
      .eq('id', quotationId)
      .single();

    notifyQuotationReceived({
      buyerId: quotation.recipient_id,
      supplierName: senderProfile?.company_name_ar || 'Ù…ÙˆØ±Ø¯',
      quotationNumber: qtnDetail?.number || quotationId,
      quotationId,
    }).catch(() => {});
  }

  revalidatePath('/dashboard/quotations');
  return { data: { sent: true }, error: null };
}

// ---------------------------------------------------------------------------
// ACCEPT QUOTATION (recipient) â†’ create DEAL-PRODUCT
// ---------------------------------------------------------------------------
export async function acceptQuotation(quotationId: string): Promise<ActionResult<{ quotationId: string; dealId: string }>> {
  const t = await getTranslations('actions.quotations');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: quotation } = await db(supabase)
    .from('quotations')
    .select('id, sender_id, recipient_id, status, total, number, mode')
    .eq('id', quotationId)
    .single();

  if (!quotation) return { data: null, error: t('quotationNotFound') };
  if (quotation.recipient_id !== user.id) {
    return { data: null, error: t('unauthorized') };
  }
  if (quotation.status !== 'sent' && quotation.status !== 'viewed') {
    return { data: null, error: t('cannotAcceptInThisStatus') };
  }

  // Update quotation status
  const { error: updateError } = await db(supabase)
    .from('quotations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', quotationId);

  if (updateError) return { data: null, error: t('genericError') };

  // Get sender tier for commission
  const { data: senderSub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', quotation.sender_id)
    .eq('is_active', true)
    .single();

  const tier = senderSub?.tier || 'starter';
  const commissionRate = COMMISSION_RATES[tier] ?? 0.02;
  const commissionAmount = quotation.total * commissionRate;
  const commissionVat = commissionAmount * VAT_RATE;

  // Create DEAL-PRODUCT
  const { data: deal, error: dealError } = await db(supabase)
    .from('deals')
    .insert({
      title_slug: `deal-${quotation.number}`,
      title_ar: `\u0639\u0631\u0636 \u0633\u0639\u0631 #${quotation.number}`,
      title_en: `Quotation #${quotation.number}`,
      deal_type: 'deal_product',
      trigger_source: 'inquiry_quotation',
      quotation_id: quotationId,
      seller_id: quotation.sender_id,
      buyer_id: user.id,
      value: quotation.total,
      commission_rate: commissionRate * 100,
      commission_amount: commissionAmount,
      commission_vat: commissionVat,
      status: 'active',
    })
    .select('id')
    .single();

  if (dealError || !deal) {
    return { data: null, error: t('dealCreateError') };
  }

  // Notify seller: quotation accepted
  notifyQuotationAccepted({
    supplierId: quotation.sender_id,
    quotationNumber: quotation.number || quotationId,
    quotationId,
  }).catch(() => {});

  // Notify both: deal created
  notifyDealCreated({
    userIds: [quotation.sender_id, user.id],
    dealNumber: `deal-${quotation.number}`,
    dealId: deal.id,
  }).catch(() => {});

  // Auto-link counterparty as CRM client
  autoLinkClient(deal.id).catch(() => {});

  revalidatePath('/dashboard/quotations');
  revalidatePath('/dashboard/deals');
  return { data: { quotationId, dealId: deal.id }, error: null };
}

// ---------------------------------------------------------------------------
// REJECT QUOTATION (recipient)
// ---------------------------------------------------------------------------
export async function rejectQuotation(
  quotationId: string,
  reason?: string,
): Promise<ActionResult<{ rejected: boolean }>> {
  const t = await getTranslations('actions.quotations');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: quotation } = await db(supabase)
    .from('quotations')
    .select('id, recipient_id, status')
    .eq('id', quotationId)
    .single();

  if (!quotation || quotation.recipient_id !== user.id) {
    return { data: null, error: t('quotationNotFound') };
  }

  if (quotation.status !== 'sent' && quotation.status !== 'viewed') {
    return { data: null, error: t('cannotRejectInThisStatus') };
  }

  const { error } = await db(supabase)
    .from('quotations')
    .update({ status: 'rejected' })
    .eq('id', quotationId);

  if (error) return { data: null, error: t('genericError') };

  revalidatePath('/dashboard/quotations');
  return { data: { rejected: true }, error: null };
}

// ---------------------------------------------------------------------------
// DUPLICATE QUOTATION (sender) â€” creates a draft copy
// ---------------------------------------------------------------------------
export async function duplicateQuotation(
  quotationId: string,
): Promise<ActionResult<{ id: string; quotation_number: string }>> {
  const t = await getTranslations('actions.quotations');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Fetch original quotation
  const { data: original } = await db(supabase)
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single();

  if (!original || original.sender_id !== user.id) {
    return { data: null, error: t('quotationNotFound') };
  }

  // Tier limit check (monthly quotation count)
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const monthlyLimit = TIER_LIMITS[tier]?.quotationsPerMonth ?? 3;

  if (monthlyLimit !== Infinity) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await db(supabase)
      .from('quotations')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if ((count ?? 0) >= monthlyLimit) {
      return { data: null, error: t('monthlyLimitReached', { limit: monthlyLimit }) };
    }
  }

  // Auto-generate quotation number
  const year = new Date().getFullYear();
  const { count: existingCount } = await db(supabase)
    .from('quotations')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .gte('created_at', `${year}-01-01T00:00:00Z`);

  const seqNum = ((existingCount ?? 0) + 1).toString().padStart(4, '0');
  const quotationNumber = `QTN-${year}-${seqNum}`;

  // Insert copy as draft
  const { data: copy, error } = await db(supabase)
    .from('quotations')
    .insert({
      sender_id: user.id,
      recipient_id: original.recipient_id || null,
      mode: original.mode,
      number: quotationNumber,
      inquiry_id: original.inquiry_id || null,
      rfq_response_id: original.rfq_response_id || null,
      hire_request_id: original.hire_request_id || null,
      client_name: original.client_name || null,
      project_ref: original.project_ref || null,
      line_items: original.line_items,
      subtotal: original.subtotal,
      vat_amount: original.vat_amount,
      total: original.total,
      validity_days: original.validity_days,
      payment_terms_ar: original.payment_terms_ar || null,
      payment_terms_en: original.payment_terms_en || null,
      delivery_terms_ar: original.delivery_terms_ar || null,
      delivery_terms_en: original.delivery_terms_en || null,
      notes_ar: original.notes_ar || null,
      notes_en: original.notes_en || null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !copy) {
    return { data: null, error: t('genericError') };
  }

  revalidatePath('/dashboard/quotations');
  return { data: { id: copy.id, quotation_number: quotationNumber }, error: null };
}

// ---------------------------------------------------------------------------
// BULK DELETE DRAFT QUOTATIONS (sender only)
// ---------------------------------------------------------------------------
export async function bulkDeleteDraftQuotations(
  ids: string[],
): Promise<ActionResult<{ deleted: number }>> {
  const t = await getTranslations('actions.quotations');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };
  if (!ids.length) return { data: { deleted: 0 }, error: null };

  // Only delete drafts owned by the current user
  const { count, error } = await db(supabase)
    .from('quotations')
    .delete({ count: 'exact' })
    .in('id', ids)
    .eq('sender_id', user.id)
    .eq('status', 'draft');

  if (error) return { data: null, error: t('genericError') };

  revalidatePath('/dashboard/quotations');
  return { data: { deleted: count ?? 0 }, error: null };
}

// ---------------------------------------------------------------------------
// BULK SEND DRAFT QUOTATIONS (sender only)
// ---------------------------------------------------------------------------
export async function bulkSendQuotations(
  ids: string[],
): Promise<ActionResult<{ sent: number }>> {
  const t = await getTranslations('actions.quotations');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };
  if (!ids.length) return { data: { sent: 0 }, error: null };

  // Only send drafts owned by the current user
  const { count, error } = await db(supabase)
    .from('quotations')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .in('id', ids)
    .eq('sender_id', user.id)
    .eq('status', 'draft');

  if (error) return { data: null, error: t('genericError') };

  revalidatePath('/dashboard/quotations');
  return { data: { sent: count ?? 0 }, error: null };
}
