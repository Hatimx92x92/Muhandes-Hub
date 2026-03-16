// =============================================================================
// Muqawil HUB — Contract Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ContractSchema, SignContractSchema, ClauseSchema } from '@/schemas/contract';
import type { ActionResult } from '@/types';
import { TIER_LIMITS } from '@/types';

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
// createContract — Create a new contract (standalone or deal-linked)
// ---------------------------------------------------------------------------
export async function createContract(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.contracts');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Parse form data
  const rawData = {
    deal_id: formData.get('deal_id') as string || undefined,
    template_type: formData.get('template_type') as string,
    party_a: JSON.parse(formData.get('party_a') as string || '{}'),
    party_b: JSON.parse(formData.get('party_b') as string || '{}'),
    scope_ar: formData.get('scope_ar') as string || undefined,
    scope_en: formData.get('scope_en') as string || undefined,
    payment_terms_ar: formData.get('payment_terms_ar') as string || undefined,
    payment_terms_en: formData.get('payment_terms_en') as string || undefined,
    timeline: formData.get('timeline') as string || undefined,
    penalties_ar: formData.get('penalties_ar') as string || undefined,
    penalties_en: formData.get('penalties_en') as string || undefined,
    warranty_ar: formData.get('warranty_ar') as string || undefined,
    warranty_en: formData.get('warranty_en') as string || undefined,
    governing_law: formData.get('governing_law') as string || 'Saudi Arabian Law',
    additional_clauses: JSON.parse(formData.get('additional_clauses') as string || '[]'),
  };

  const parsed = ContractSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Tier limit check
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = (profile?.subscription_tier as string) || 'starter';
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

  if (limits) {
    // Check template access (Starter: only construction_agreement and supply_agreement)
    if (tier === 'starter' && parsed.data.template_type === 'custom') {
      return { data: null, error: t('customTemplatesProOnly') };
    }

    // Check contracts per month
    if (limits.contractsPerMonth !== Infinity) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await db(supabase)
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if ((count ?? 0) >= limits.contractsPerMonth) {
        return { data: null, error: t('monthlyLimitReached', { limit: limits.contractsPerMonth }) };
      }
    }
  }

  const { data: contract, error } = await db(supabase)
    .from('contracts')
    .insert({
      creator_id: user.id,
      deal_id: parsed.data.deal_id || null,
      template_type: parsed.data.template_type,
      party_a: parsed.data.party_a,
      party_b: parsed.data.party_b,
      scope_ar: parsed.data.scope_ar,
      scope_en: parsed.data.scope_en,
      payment_terms_ar: parsed.data.payment_terms_ar,
      payment_terms_en: parsed.data.payment_terms_en,
      timeline: parsed.data.timeline,
      penalties_ar: parsed.data.penalties_ar,
      penalties_en: parsed.data.penalties_en,
      warranty_ar: parsed.data.warranty_ar,
      warranty_en: parsed.data.warranty_en,
      governing_law: parsed.data.governing_law,
      additional_clauses: parsed.data.additional_clauses,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('createError') };

  revalidatePath('/dashboard/contracts');
  return { data: { id: contract.id }, error: null };
}

// ---------------------------------------------------------------------------
// signContract — Sign a contract (typed signature)
// ---------------------------------------------------------------------------
export async function signContract(
  _prev: ActionResult<{ signed: boolean; fullyExecuted: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ signed: boolean; fullyExecuted: boolean }>> {
  const t = await getTranslations('actions.contracts');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    contract_id: formData.get('contract_id') as string,
    signatory_name: formData.get('signatory_name') as string,
    signatory_title: formData.get('signatory_title') as string,
  };

  const parsed = SignContractSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Verify contract exists and user is a party
  const { data: contract } = await db(supabase)
    .from('contracts')
    .select('id, creator_id, party_a, party_b, status')
    .eq('id', parsed.data.contract_id)
    .single();

  if (!contract) return { data: null, error: t('contractNotFound') };
  if (contract.status === 'signed') return { data: null, error: t('alreadySigned') };

  // Insert signature
  const { error: sigError } = await db(supabase)
    .from('contract_signatures')
    .insert({
      contract_id: parsed.data.contract_id,
      user_id: user.id,
      name: parsed.data.signatory_name,
      title: parsed.data.signatory_title,
    });

  if (sigError) {
    if (sigError.code === '23505') return { data: null, error: t('alreadySignedByYou') };
    return { data: null, error: t('signError') };
  }

  // Check if both parties signed
  const { count } = await db(supabase)
    .from('contract_signatures')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', parsed.data.contract_id);

  const fullyExecuted = (count ?? 0) >= 2;

  if (fullyExecuted) {
    await db(supabase)
      .from('contracts')
      .update({ status: 'signed' })
      .eq('id', parsed.data.contract_id);
  } else if (contract.status === 'draft') {
    await db(supabase)
      .from('contracts')
      .update({ status: 'sent' })
      .eq('id', parsed.data.contract_id);
  }

  revalidatePath(`/dashboard/contracts`);
  return { data: { signed: true, fullyExecuted }, error: null };
}

// ---------------------------------------------------------------------------
// verifyContract — Public verification (no auth required)
// ---------------------------------------------------------------------------
export async function verifyContract(
  qrUuid: string,
): Promise<ActionResult<{ exists: boolean; signed_at_a?: string; signed_at_b?: string }>> {
  const supabase = await createClient();

  const { data: contract } = await db(supabase)
    .from('contracts')
    .select('id, status, created_at')
    .eq('qr_uuid', qrUuid)
    .single();

  if (!contract) return { data: { exists: false }, error: null };

  const { data: signatures } = await db(supabase)
    .from('contract_signatures')
    .select('name, signed_at')
    .eq('contract_id', contract.id)
    .order('signed_at', { ascending: true });

  return {
    data: {
      exists: true,
      signed_at_a: signatures?.[0]?.signed_at,
      signed_at_b: signatures?.[1]?.signed_at,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Clause Library — CRUD
// ---------------------------------------------------------------------------
export async function createClause(
  _prev: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.contracts');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    title_ar: formData.get('title_ar') as string,
    title_en: formData.get('title_en') as string,
    content_ar: formData.get('content_ar') as string,
    content_en: formData.get('content_en') as string,
    category: formData.get('category') as string,
  };

  const parsed = ClauseSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { data: clause, error } = await db(supabase)
    .from('contract_clauses')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('clauseCreateError') };

  revalidatePath('/dashboard/contracts');
  return { data: { id: clause.id }, error: null };
}

export async function deleteClause(clauseId: string): Promise<ActionResult> {
  const t = await getTranslations('actions.contracts');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('contract_clauses')
    .delete()
    .eq('id', clauseId)
    .eq('user_id', user.id);

  if (error) return { data: null, error: t('deleteError') };

  revalidatePath('/dashboard/contracts');
  return { data: undefined, error: null };
}
