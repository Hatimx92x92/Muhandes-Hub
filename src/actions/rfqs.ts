// =============================================================================
// Muqawil HUB — RFQ Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { RFQSchema, RFQResponseSchema } from '@/schemas/rfq';
import type { ActionResult } from '@/types';
import { VAT_RATE } from '@/types';
import {
  notifyRfqResponseReceived,
  notifyRfqResponseAccepted,
  notifyRfqResponseRejected,
  notifyDealCreated,
} from '@/actions/notification-triggers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

// ---------------------------------------------------------------------------
// CREATE RFQ
// ---------------------------------------------------------------------------
export async function createRFQ(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.rfqs');
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. All roles can create RFQs (PO, Contractor, Supplier, Buyer)
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) return { data: null, error: t('profileNotFound') };

  // 3. Parse & validate
  const raw = {
    title_ar: formData.get('title_ar'),
    title_en: formData.get('title_en'),
    description_ar: formData.get('description_ar'),
    description_en: formData.get('description_en'),
    category_id: formData.get('category_id') || undefined,
    quantity: formData.get('quantity') || undefined,
    budget_min: formData.get('budget_min') || undefined,
    budget_max: formData.get('budget_max') || undefined,
    deadline: formData.get('deadline') || undefined,
    city: formData.get('city') || undefined,
    project_id: formData.get('project_id') || undefined,
    product_id: formData.get('product_id') || undefined,
  };

  const parsed = RFQSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // 4. Insert RFQ as draft
  const { data: rfq, error } = await db(supabase)
    .from('rfqs')
    .insert({
      poster_id: user.id,
      title_ar: parsed.data.title_ar,
      title_en: parsed.data.title_en,
      description_ar: parsed.data.description_ar,
      description_en: parsed.data.description_en,
      category_id: parsed.data.category_id || null,
      quantity: parsed.data.quantity || null,
      budget_min: parsed.data.budget_min || null,
      budget_max: parsed.data.budget_max || null,
      deadline: parsed.data.deadline || null,
      city_id: null, // Will be resolved when city table is available
      project_id: parsed.data.project_id || null,
      product_id: parsed.data.product_id || null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !rfq) {
    return { data: null, error: t('createError') };
  }

  revalidatePath('/dashboard/rfqs');
  return { data: { id: rfq.id }, error: null };
}

// ---------------------------------------------------------------------------
// SUBMIT RFQ FOR APPROVAL
// ---------------------------------------------------------------------------
export async function submitRFQForApproval(rfqId: string): Promise<ActionResult> {
  const t = await getTranslations('actions.rfqs');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: rfq } = await db(supabase)
    .from('rfqs')
    .select('id, poster_id, status')
    .eq('id', rfqId)
    .single();

  if (!rfq || rfq.poster_id !== user.id) {
    return { data: null, error: t('rfqNotFound') };
  }

  if (rfq.status !== 'draft' && rfq.status !== 'rejected') {
    return { data: null, error: t('cannotSubmitForReview') };
  }

  const { error } = await db(supabase)
    .from('rfqs')
    .update({ status: 'pending' })
    .eq('id', rfqId);

  if (error) return { data: null, error: t('genericError') };

  // TODO: Notify admins
  revalidatePath('/dashboard/rfqs');
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// RESPOND TO RFQ (supplier only)
// ---------------------------------------------------------------------------
export async function respondToRFQ(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.rfqs');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Supplier only
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    return { data: null, error: t('suppliersOnly') };
  }

  const raw = {
    rfq_id: formData.get('rfq_id'),
    pricing: formData.get('pricing') || '{}',
    delivery_terms_ar: formData.get('delivery_terms_ar') || undefined,
    delivery_terms_en: formData.get('delivery_terms_en') || undefined,
    notes_ar: formData.get('notes_ar') || undefined,
    notes_en: formData.get('notes_en') || undefined,
  };

  const parsed = RFQResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Verify RFQ is published and before deadline
  const { data: rfq } = await db(supabase)
    .from('rfqs')
    .select('id, status, deadline')
    .eq('id', parsed.data.rfq_id)
    .single();

  if (!rfq || rfq.status !== 'published') {
    return { data: null, error: t('rfqNotAvailable') };
  }

  if (rfq.deadline && new Date(rfq.deadline) < new Date()) {
    return { data: null, error: t('deadlinePassed') };
  }

  // Check no existing response
  const { data: existing } = await db(supabase)
    .from('rfq_responses')
    .select('id')
    .eq('rfq_id', parsed.data.rfq_id)
    .eq('supplier_id', user.id)
    .single();

  if (existing) {
    return { data: null, error: t('alreadyResponded') };
  }

  // Parse pricing JSON
  let pricing;
  try {
    pricing = JSON.parse(parsed.data.pricing);
  } catch {
    pricing = {};
  }

  const { data: response, error } = await db(supabase)
    .from('rfq_responses')
    .insert({
      rfq_id: parsed.data.rfq_id,
      supplier_id: user.id,
      pricing,
      delivery_terms_ar: parsed.data.delivery_terms_ar || null,
      delivery_terms_en: parsed.data.delivery_terms_en || null,
      notes_ar: parsed.data.notes_ar || null,
      notes_en: parsed.data.notes_en || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !response) {
    return { data: null, error: t('responseSubmitError') };
  }

  // Notify poster
  const { data: rfqForNotify } = await db(supabase)
    .from('rfqs')
    .select('poster_id, title_ar, title_en')
    .eq('id', parsed.data.rfq_id)
    .single();

  if (rfqForNotify) {
    const { data: responderProfile } = await db(supabase)
      .from('profiles')
      .select('company_name_ar')
      .eq('id', user.id)
      .single();

    notifyRfqResponseReceived({
      ownerId: rfqForNotify.poster_id,
      rfqTitle: { ar: rfqForNotify.title_ar, en: rfqForNotify.title_en },
      responderName: responderProfile?.company_name_ar || 'مورد',
      rfqId: parsed.data.rfq_id,
      responseId: response.id,
    }).catch(() => {});
  }

  revalidatePath(`/rfqs/${parsed.data.rfq_id}`);
  revalidatePath('/dashboard/rfqs');
  return { data: { id: response.id }, error: null };
}

// ---------------------------------------------------------------------------
// ACCEPT RFQ RESPONSE (poster)
// ---------------------------------------------------------------------------
export async function acceptRFQResponse(responseId: string): Promise<ActionResult<{ dealId: string }>> {
  const t = await getTranslations('actions.rfqs');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: response } = await db(supabase)
    .from('rfq_responses')
    .select('id, rfq_id, supplier_id, pricing, status')
    .eq('id', responseId)
    .single();

  if (!response) return { data: null, error: t('responseNotFound') };

  // Verify poster ownership of RFQ
  const { data: rfq } = await db(supabase)
    .from('rfqs')
    .select('id, poster_id, title_ar, project_id')
    .eq('id', response.rfq_id)
    .single();

  if (!rfq || rfq.poster_id !== user.id) {
    return { data: null, error: t('unauthorized') };
  }

  if (response.status !== 'pending') {
    return { data: null, error: t('cannotAcceptInThisStatus') };
  }

  // Accept response
  await db(supabase)
    .from('rfq_responses')
    .update({ status: 'accepted' })
    .eq('id', responseId);

  // Calculate deal value from pricing
  const pricingData = response.pricing || {};
  const dealValue = pricingData.total || 0;

  // Get supplier tier for commission
  const { data: supplier } = await db(supabase)
    .from('profiles')
    .select('subscription_tier')
    .eq('id', response.supplier_id)
    .single();

  const tier = supplier?.subscription_tier || 'starter';
  const commissionRates: Record<string, number> = { starter: 0.02, pro: 0.01, business: 0, enterprise: 0 };
  const commRate = commissionRates[tier] ?? 0.02;

  // Create deal
  const { data: deal, error: dealError } = await db(supabase)
    .from('deals')
    .insert({
      title_slug: `deal-rfq-${rfq.title_ar?.slice(0, 20) || response.rfq_id}`,
      deal_type: 'DEAL-PRODUCT',
      trigger_source: 'rfq_response_accepted',
      rfq_response_id: responseId,
      project_id: rfq.project_id || null,
      seller_id: response.supplier_id,
      buyer_id: user.id,
      value: dealValue,
      commission_rate: commRate * 100,
      commission_amount: dealValue * commRate,
      commission_vat: dealValue * commRate * VAT_RATE,
      status: 'active',
    })
    .select('id')
    .single();

  if (dealError || !deal) {
    return { data: null, error: t('dealCreateError') };
  }

  // Notify supplier: response accepted
  notifyRfqResponseAccepted({
    supplierId: response.supplier_id,
    rfqTitle: { ar: rfq.title_ar, en: rfq.title_ar },
    rfqId: response.rfq_id,
    responseId,
  }).catch(() => {});

  // Notify both: deal created
  notifyDealCreated({
    userIds: [response.supplier_id, user.id],
    dealNumber: deal.id.slice(0, 8),
    dealId: deal.id,
  }).catch(() => {});

  revalidatePath('/dashboard/rfqs');
  revalidatePath('/dashboard/deals');
  return { data: { dealId: deal.id }, error: null };
}

// ---------------------------------------------------------------------------
// REJECT RFQ RESPONSE (poster)
// ---------------------------------------------------------------------------
export async function rejectRFQResponse(
  responseId: string,
  reason?: string,
): Promise<ActionResult> {
  const t = await getTranslations('actions.rfqs');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: response } = await db(supabase)
    .from('rfq_responses')
    .select('id, rfq_id, status')
    .eq('id', responseId)
    .single();

  if (!response) return { data: null, error: t('responseNotFound') };

  const { data: rfq } = await db(supabase)
    .from('rfqs')
    .select('poster_id')
    .eq('id', response.rfq_id)
    .single();

  if (!rfq || rfq.poster_id !== user.id) {
    return { data: null, error: t('unauthorized') };
  }

  if (response.status !== 'pending') {
    return { data: null, error: t('cannotRejectInThisStatus') };
  }

  await db(supabase)
    .from('rfq_responses')
    .update({ status: 'rejected' })
    .eq('id', responseId);

  // Notify supplier
  notifyRfqResponseRejected({
    supplierId: response.supplier_id || '',
    rfqTitle: { ar: '', en: '' },
    responseId,
  }).catch(() => {});

  revalidatePath('/dashboard/rfqs');
  return { data: undefined, error: null };
}
