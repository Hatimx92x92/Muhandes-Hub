// =============================================================================
// Muqawil HUB — Product Inquiry & Direct Hire Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { ProductInquirySchema, DirectHireSchema } from '@/schemas/inquiry';
import type { ActionResult } from '@/types';
import { VAT_RATE } from '@/types';
import {
  notifyInquiryReceived,
  notifySupplierHireRequestReceived,
  notifySupplierHireQuotationReceived,
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
// SEND PRODUCT INQUIRY
// ---------------------------------------------------------------------------
export async function sendProductInquiry(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.inquiries');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    product_id: formData.get('product_id'),
    message_ar: formData.get('message_ar'),
    message_en: formData.get('message_en') || undefined,
    quantity: formData.get('quantity') || undefined,
  };

  const parsed = ProductInquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // get product and supplier
  const { data: product } = await db(supabase)
    .from('products')
    .select('id, supplier_id, title_ar')
    .eq('id', parsed.data.product_id)
    .eq('status', 'published')
    .single();

  if (!product) return { data: null, error: t('productNotAvailable') };

  // Can't inquire about own product
  if (product.supplier_id === user.id) {
    return { data: null, error: t('cannotInquireOwnProduct') };
  }

  // Insert inquiry
  const { data: inquiry, error } = await db(supabase)
    .from('product_inquiries')
    .insert({
      product_id: parsed.data.product_id,
      sender_id: user.id,
      supplier_id: product.supplier_id,
      message_ar: parsed.data.message_ar,
      message_en: parsed.data.message_en || null,
      quantity: parsed.data.quantity || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !inquiry) {
    return { data: null, error: t('submitInquiryError') };
  }

  // Notify supplier
  const { data: senderProfile } = await db(supabase)
    .from('profiles')
    .select('company_name_ar')
    .eq('id', user.id)
    .single();

  notifyInquiryReceived({
    supplierId: product.supplier_id,
    productTitle: { ar: product.title_ar, en: product.title_ar },
    inquirerName: senderProfile?.company_name_ar || t('defaultUser'),
    productId: parsed.data.product_id,
    inquiryId: inquiry.id,
  }).catch(() => {});

  revalidatePath(`/marketplace/${parsed.data.product_id}`);
  return { data: { id: inquiry.id }, error: null };
}

// ---------------------------------------------------------------------------
// SEND DIRECT HIRE REQUEST
// ---------------------------------------------------------------------------
export async function sendDirectHireRequest(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.inquiries');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Check user role — PO, Contractor, Buyer can hire suppliers
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['project_owner', 'contractor', 'buyer'].includes(profile.role)) {
    return { data: null, error: t('actionNotAllowed') };
  }

  const raw = {
    supplier_id: formData.get('supplier_id'),
    description_ar: formData.get('description_ar'),
    description_en: formData.get('description_en') || undefined,
    budget: formData.get('budget') || undefined,
    project_id: formData.get('project_id') || undefined,
  };

  const parsed = DirectHireSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Verify supplier exists
  const { data: supplier } = await db(supabase)
    .from('profiles')
    .select('id, role')
    .eq('id', parsed.data.supplier_id)
    .eq('role', 'supplier')
    .single();

  if (!supplier) return { data: null, error: t('supplierNotFound') };

  // Can't hire yourself
  if (supplier.id === user.id) {
    return { data: null, error: t('cannotHireSelf') };
  }

  // Insert hire request
  const { data: request, error } = await db(supabase)
    .from('hire_requests')
    .insert({
      requester_id: user.id,
      supplier_id: parsed.data.supplier_id,
      description_ar: parsed.data.description_ar,
      description_en: parsed.data.description_en || null,
      budget: parsed.data.budget || null,
      project_id: parsed.data.project_id || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !request) {
    return { data: null, error: t('submitHireError') };
  }

  // Notify supplier
  notifySupplierHireRequestReceived({
    supplierId: parsed.data.supplier_id,
    requesterName: profile?.role || t('defaultUser'),
    requestId: request.id,
  }).catch(() => {});

  revalidatePath(`/partners/${parsed.data.supplier_id}`);
  return { data: { id: request.id }, error: null };
}

// ---------------------------------------------------------------------------
// ACCEPT HIRE REQUEST — supplier creates quotation for the requester
// ---------------------------------------------------------------------------
export async function acceptHireRequest(
  _prevState: ActionResult<{ quotationId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ quotationId: string }>> {
  const t = await getTranslations('actions.inquiries');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const requestId = formData.get('request_id') as string;
  const amountStr = formData.get('amount') as string;
  const descriptionAr = formData.get('description_ar') as string;
  const descriptionEn = (formData.get('description_en') as string) || null;

  if (!requestId || !amountStr || !descriptionAr) {
    return { data: null, error: t('incompleteData') };
  }

  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { data: null, error: t('invalidAmount') };
  }

  // Verify hire request belongs to this supplier and is pending
  const { data: request } = await db(supabase)
    .from('hire_requests')
    .select('id, requester_id, supplier_id, project_id, status')
    .eq('id', requestId)
    .eq('supplier_id', user.id)
    .eq('status', 'pending')
    .single();

  if (!request) {
    return { data: null, error: t('hireRequestNotFound') };
  }

  // Calculate VAT
  const netAmount = amount;
  const vatAmount = Math.round(netAmount * VAT_RATE * 100) / 100;
  const totalAmount = netAmount + vatAmount;

  // Generate quotation number: QTN-YYYY-NNNN
  const year = new Date().getFullYear();
  const { count } = await db(supabase)
    .from('quotations')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id);
  const seq = String((count ?? 0) + 1).padStart(4, '0');
  const quotationNumber = `QTN-${year}-${seq}`;

  // Create quotation
  const { data: quotation, error: qError } = await db(supabase)
    .from('quotations')
    .insert({
      quotation_number: quotationNumber,
      sender_id: user.id,
      recipient_id: request.requester_id,
      hire_request_id: requestId,
      project_id: request.project_id || null,
      description_ar: descriptionAr,
      description_en: descriptionEn,
      subtotal: netAmount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      status: 'sent',
    })
    .select('id')
    .single();

  if (qError || !quotation) {
    return { data: null, error: t('createQuotationError') };
  }

  // Update hire request status
  await db(supabase)
    .from('hire_requests')
    .update({ status: 'accepted', quotation_id: quotation.id })
    .eq('id', requestId);

  // Notify requester
  const { data: supplierProfile } = await db(supabase)
    .from('profiles')
    .select('company_name_ar')
    .eq('id', user.id)
    .single();

  notifySupplierHireQuotationReceived({
    requesterId: request.requester_id,
    supplierName: supplierProfile?.company_name_ar || t('defaultSupplier'),
    quotationId: quotation.id,
  }).catch(() => {});

  revalidatePath('/dashboard/hire-requests');
  revalidatePath(`/dashboard/quotations/${quotation.id}`);
  return { data: { quotationId: quotation.id }, error: null };
}

// ---------------------------------------------------------------------------
// DECLINE HIRE REQUEST
// ---------------------------------------------------------------------------
export async function declineHireRequest(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations('actions.inquiries');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const requestId = formData.get('request_id') as string;
  const reason = (formData.get('reason') as string) || null;

  if (!requestId) return { data: null, error: t('requestIdRequired') };

  // Verify hire request belongs to this supplier and is pending
  const { data: request } = await db(supabase)
    .from('hire_requests')
    .select('id, requester_id, supplier_id, status')
    .eq('id', requestId)
    .eq('supplier_id', user.id)
    .eq('status', 'pending')
    .single();

  if (!request) {
    return { data: null, error: t('hireRequestNotFound') };
  }

  // Update hire request status
  await db(supabase)
    .from('hire_requests')
    .update({ status: 'declined', decline_reason: reason })
    .eq('id', requestId);

  revalidatePath('/dashboard/hire-requests');
  return { data: undefined, error: null };
}
