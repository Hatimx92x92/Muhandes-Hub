// =============================================================================
// Kanban Board — Client Component
// with Done→proof prompt, progress sync, and realtime updates
// =============================================================================

'use client';

import { useActionState, useState, useTransition, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FileCheck } from 'lucide-react';
import {
  initializeKanban,
  createKanbanCard,
  moveKanbanCard,
  deleteKanbanCard,
} from '@/actions/kanban';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { ActionResult } from '@/types';

interface KanbanCard {
  id: string;
  title: string;
  description: string;
  assignee_name: string;
  due_date: string;
  priority: string;
}

interface KanbanColumn {
  id: string;
  name: string;
  sort_order: number;
  cards: KanbanCard[];
}

interface Props {
  dealId: string;
  columns: KanbanColumn[];
  hasColumns: boolean;
  tier: string;
}

const PRIORITY_VARIANTS: Record<string, string> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  urgent: 'destructive',
};

type InitState = ActionResult<{ initialized: boolean }> | null;
type CardState = ActionResult<{ id: string }> | null;

export function KanbanBoard({ dealId, columns: initialColumns, hasColumns, tier }: Props) {
  const [initState, initAction, initPending] = useActionState<InitState, FormData>(initializeKanban, null);
  const [addCardState, addCardAction, addCardPending] = useActionState<CardState, FormData>(createKanbanCard, null);
  const [isPending, startTransition] = useTransition();
  const [activeAddColumn, setActiveAddColumn] = useState<string | null>(null);
  const [showProofPrompt, setShowProofPrompt] = useState(false);
  const [columns, setColumns] = useState(initialColumns);
  const t = useTranslations('features.kanban');
  const locale = useLocale();

  // Sync columns from server
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // ---------- Progress Sync ----------
  const totalCards = columns.reduce((sum, col) => sum + col.cards.length, 0);
  const lastColumn = columns.length > 0 ? columns[columns.length - 1] : null;
  const doneCards = lastColumn ? lastColumn.cards.length : 0;
  const progressPercent = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0;

  // ---------- Realtime subscription ----------
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`kanban:${dealId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_cards', filter: `deal_id=eq.${dealId}` },
        () => {
          // Trigger page reload to get fresh data
          window.location.reload();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_columns', filter: `deal_id=eq.${dealId}` },
        () => {
          window.location.reload();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  // ---------- Move handler with done-column proof prompt ----------
  const handleMoveCard = useCallback((cardId: string, targetColumnId: string, position: number) => {
    const fd = new FormData();
    fd.set('card_id', cardId);
    fd.set('target_column_id', targetColumnId);
    fd.set('position', String(position));
    fd.set('deal_id', dealId);

    // Check if moving to the last column (Done)
    const isDoneColumn = lastColumn && targetColumnId === lastColumn.id;

    startTransition(() => { moveKanbanCard(null, fd); });

    if (isDoneColumn) {
      setShowProofPrompt(true);
    }
  }, [dealId, lastColumn]);

  function handleDeleteCard(cardId: string) {
    const fd = new FormData();
    fd.set('card_id', cardId);
    fd.set('deal_id', dealId);
    startTransition(() => { deleteKanbanCard(null, fd); });
  }

  // Initialize board
  if (!hasColumns) {
    return (
      <Card className="p-12 text-center space-y-4">
        <p className="text-muted-foreground">{t('noBoardMessage')}</p>
        {initState?.error && (
          <p className="text-sm text-destructive">{initState.error}</p>
        )}
        <form action={initAction}>
          <input type="hidden" name="deal_id" value={dealId} />
          <Button type="submit" variant="primary" loading={initPending}>
            {t('createBoard')}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {totalCards > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">{t('progress')}</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-primary">{progressPercent}%</span>
        </div>
      )}

      {/* Proof Prompt */}
      {showProofPrompt && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <FileCheck className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm flex-1">
            {t('proofPrompt')}
          </p>
          <Link href={`/dashboard/deals/${dealId}/proofs/new`}>
            <Button variant="primary" size="sm">{t('attachProof')}</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setShowProofPrompt(false)}>
            {t('later')}
          </Button>
        </div>
      )}

      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[800px]">
        {columns.map((col, colIndex) => (
          <div
            key={col.id}
            className="flex-1 min-w-[220px] rounded-xl bg-muted/30 border border-border p-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">{col.name}</h3>
              <Badge variant="secondary">{col.cards.length}</Badge>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[100px]">
              {col.cards.map(card => {
                const variant = PRIORITY_VARIANTS[card.priority] || PRIORITY_VARIANTS.medium;
                return (
                  <Card key={card.id} className="p-3 space-y-2 group">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-medium leading-tight">{card.title}</h4>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        disabled={isPending}
                      >
                        ✕
                      </button>
                    </div>
                    {card.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant={variant as 'secondary' | 'info' | 'warning' | 'destructive'}>
                        {t(`priority.${card.priority}` as 'priority.low')}
                      </Badge>
                      {card.assignee_name && (
                        <span className="text-[10px] text-muted-foreground">{card.assignee_name}</span>
                      )}
                      {card.due_date && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(card.due_date).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {colIndex > 0 && (
                        <button
                          onClick={() => handleMoveCard(card.id, columns[colIndex - 1].id, 0)}
                          disabled={isPending}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          → {columns[colIndex - 1].name}
                        </button>
                      )}
                      {colIndex < columns.length - 1 && (
                        <button
                          onClick={() => handleMoveCard(card.id, columns[colIndex + 1].id, 0)}
                          disabled={isPending}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          ← {columns[colIndex + 1].name}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Add Card */}
            {activeAddColumn === col.id ? (
              <form action={addCardAction} className="mt-2 space-y-2">
                <input type="hidden" name="column_id" value={col.id} />
                <input type="hidden" name="deal_id" value={dealId} />
                <Input name="title" placeholder={t('taskTitlePlaceholder')} autoFocus />
                <select
                  name="priority"
                  className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs"
                  defaultValue="medium"
                >
                  <option value="low">{t('priority.low')}</option>
                  <option value="medium">{t('priority.medium')}</option>
                  <option value="high">{t('priority.high')}</option>
                  <option value="urgent">{t('priority.urgent')}</option>
                </select>
                {addCardState?.error && (
                  <p className="text-xs text-destructive">{addCardState.error}</p>
                )}
                <div className="flex gap-1">
                  <Button type="submit" variant="primary" size="sm" loading={addCardPending}>
                    {t('add')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setActiveAddColumn(null)}>
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setActiveAddColumn(col.id)}
                className="mt-2 w-full rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                {t('addTask')}
              </button>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
