// =============================================================================
// Contract Form — Client Component
// =============================================================================

'use client';

import { useState, useActionState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Check, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BilingualFieldPair } from '@/components/ui/bilingual-field-pair';
import { FormField } from '@/components/forms/form-field';
import { createContract } from '@/actions/contracts';
import { cn } from '@/lib/utils';
import { getLocaleField } from '@/lib/utils';
import type { ActionResult } from '@/types';

interface ContractFormProps {
  dealId?: string;
  profile: Record<string, unknown>;
  dealInfo: { deal: Record<string, unknown>; counterparty: Record<string, unknown> } | null;
  clauses: Array<Record<string, unknown>>;
}

type State = ActionResult<{ id: string }> | null;

// Sortable clause item in the reorder list
function SortableClauseItem({ id, clause, locale, onRemove }: {
  id: string;
  clause: Record<string, unknown>;
  locale: string;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-xs"
    >
      <button type="button" className="cursor-grab touch-none text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate font-medium">{getLocaleField(clause, 'title', locale)}</span>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="text-muted-foreground hover:text-destructive transition-colors text-xs px-1"
      >
        ✕
      </button>
    </div>
  );
}

export function ContractForm({ dealId, profile, dealInfo, clauses }: ContractFormProps) {
  const t = useTranslations('forms.contract');
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState<State, FormData>(createContract, null);
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleClause = (id: string) => {
    setSelectedClauseIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleClauseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedClauseIds(prev => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const clauseMap = Object.fromEntries(clauses.map(c => [c.id as string, c]));

  // Auto-fill Party A from profile
  const partyA = {
    name: (profile.full_name_ar as string) || '',
    company_name_ar: (profile.company_name_ar as string) || '',
    company_name_en: (profile.company_name_en as string) || '',
    cr_number: (profile.cr_number as string) || '',
    vat_number: (profile.vat_number as string) || '',
    phone: (profile.phone as string) || '',
    email: (profile.email as string) || '',
  };

  // Auto-fill Party B from deal counterparty
  const partyB = dealInfo ? {
    name: (dealInfo.counterparty?.full_name_ar as string) || '',
    company_name_ar: (dealInfo.counterparty?.company_name_ar as string) || '',
    company_name_en: (dealInfo.counterparty?.company_name_en as string) || '',
    cr_number: (dealInfo.counterparty?.cr_number as string) || '',
    vat_number: (dealInfo.counterparty?.vat_number as string) || '',
    phone: (dealInfo.counterparty?.phone as string) || '',
    email: (dealInfo.counterparty?.email as string) || '',
  } : { name: '', company_name_ar: '', company_name_en: '', cr_number: '', vat_number: '', phone: '', email: '' };

  return (
    <form action={formAction} className="space-y-8">
      {dealId && <input type="hidden" name="deal_id" value={dealId} />}
      <input type="hidden" name="party_a" value={JSON.stringify(partyA)} />
      <input type="hidden" name="party_b" value={JSON.stringify(partyB)} />
      <input type="hidden" name="additional_clauses" value={JSON.stringify(selectedClauseIds)} />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Template Type */}
      <FormField label={t('templateType')} required>
        <Select name="template_type" defaultValue="construction_agreement">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="construction_agreement">{t('constructionAgreement')}</SelectItem>
            <SelectItem value="supply_agreement">{t('supplyAgreement')}</SelectItem>
            <SelectItem value="custom">{t('custom')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Parties Preview */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t('partyA')}</h3>
          <p className="text-xs text-muted-foreground">{partyA.company_name_ar || partyA.name}</p>
          {partyA.cr_number && <p className="text-xs text-muted-foreground">{t('crLabel', { value: partyA.cr_number })}</p>}
          {partyA.vat_number && <p className="text-xs text-muted-foreground">{t('vatLabel', { value: partyA.vat_number })}</p>}
        </div>
        <div className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t('partyB')}</h3>
          {dealInfo ? (
            <>
              <p className="text-xs text-muted-foreground">{partyB.company_name_ar || partyB.name}</p>
              {partyB.cr_number && <p className="text-xs text-muted-foreground">{t('crLabel', { value: partyB.cr_number })}</p>}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t('partyBPending')}</p>
          )}
        </div>
      </div>

      {/* Scope */}
      <BilingualFieldPair
        baseName="scope"
        type="textarea"
        rows={4}
        labelAr={t('scopeAr')}
        labelEn={t('scopeEn')}
        placeholderAr={t('scopeArPlaceholder')}
        placeholderEn={t('scopeEnPlaceholder')}
        errorAr={state?.error ? state.fieldErrors?.scope_ar?.[0] : undefined}
        errorEn={state?.error ? state.fieldErrors?.scope_en?.[0] : undefined}
      />

      {/* Payment Terms */}
      <BilingualFieldPair
        baseName="payment_terms"
        type="textarea"
        rows={3}
        labelAr={t('paymentTermsAr')}
        labelEn={t('paymentTermsEn')}
        placeholderAr={t('paymentTermsArPlaceholder')}
        placeholderEn={t('paymentTermsEnPlaceholder')}
      />

      {/* Timeline */}
      <FormField label={t('timeline')}>
        <Input name="timeline" placeholder={t('timelinePlaceholder')} />
      </FormField>

      {/* Penalties */}
      <BilingualFieldPair
        baseName="penalties"
        type="textarea"
        rows={2}
        labelAr={t('penaltiesAr')}
        labelEn={t('penaltiesEn')}
        placeholderAr={t('penaltiesArPlaceholder')}
        placeholderEn={t('penaltiesEnPlaceholder')}
      />

      {/* Warranty */}
      <BilingualFieldPair
        baseName="warranty"
        type="textarea"
        rows={2}
        labelAr={t('warrantyAr')}
        labelEn={t('warrantyEn')}
        placeholderAr={t('warrantyArPlaceholder')}
        placeholderEn={t('warrantyEnPlaceholder')}
      />

      {/* Governing Law */}
      <FormField label={t('governingLaw')}>
        <Input name="governing_law" defaultValue="Saudi Arabian Law" />
      </FormField>

      {/* Clause Library */}
      {clauses.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">{t('clauseLibrary', { count: clauses.length })}</h3>
          <p className="text-xs text-muted-foreground">
            {t('clauseLibraryHint')}
            {selectedClauseIds.length > 0 && (
              <span className="ms-2 font-medium text-primary">
                ({t('selectedCount', { count: selectedClauseIds.length })})
              </span>
            )}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {clauses.map(clause => {
              const id = clause.id as string;
              const isSelected = selectedClauseIds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleClause(id)}
                  className={cn(
                    'rounded-lg border p-3 text-xs text-start transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{getLocaleField(clause, 'title', locale)}</p>
                      <p className="text-muted-foreground mt-1 line-clamp-2">
                        {getLocaleField(clause, 'content', locale)}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {clause.category as string}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Reorderable selected clauses */}
          {selectedClauseIds.length > 1 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground">{t('reorderHint')}</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleClauseDragEnd}>
                <SortableContext items={selectedClauseIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {selectedClauseIds.map(id => (
                      <SortableClauseItem
                        key={id}
                        id={id}
                        clause={clauseMap[id]}
                        locale={locale}
                        onRemove={(cid) => toggleClause(cid)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button type="submit" variant="primary" loading={isPending}>
          {t('createContract')}
        </Button>
      </div>
    </form>
  );
}
