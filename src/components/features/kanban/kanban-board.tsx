// =============================================================================
// Kanban Board — Client Component
// with DnD (drag-and-drop), Done→proof prompt, progress sync, and realtime
// =============================================================================

'use client';

import { useActionState, useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FileCheck, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  initializeKanban,
  createKanbanCard,
  moveKanbanCard,
  deleteKanbanCard,
} from '@/actions/kanban';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KanbanCardData {
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
  cards: KanbanCardData[];
}

interface Props {
  dealId: string;
  columns: KanbanColumn[];
  hasColumns: boolean;
  tier: string;
  isReadOnly?: boolean;
}

const PRIORITY_VARIANTS: Record<string, string> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  urgent: 'destructive',
};

type InitState = ActionResult<{ initialized: boolean }> | null;
type CardState = ActionResult<{ id: string }> | null;

// ---------------------------------------------------------------------------
// Sortable Card Component
// ---------------------------------------------------------------------------

function SortableCard({
  card,
  onDelete,
  isPending,
  locale,
  t,
  isReadOnly = false,
}: {
  card: KanbanCardData;
  onDelete: (id: string) => void;
  isPending: boolean;
  locale: string;
  t: (key: string) => string;
  isReadOnly?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const variant = PRIORITY_VARIANTS[card.priority] || PRIORITY_VARIANTS.medium;

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-3 space-y-2 group">
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {!isReadOnly && (
            <button
              {...attributes}
              {...listeners}
              className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <h4 className="text-sm font-medium leading-tight truncate">{card.title}</h4>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => onDelete(card.id)}
            className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive shrink-0"
            disabled={isPending}
          >
            ✕
          </button>
        )}
      </div>
      {card.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant={variant as 'secondary' | 'info' | 'warning' | 'destructive'}>
          {t(`priority.${card.priority}`)}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag Overlay Card (rendered while dragging)
// ---------------------------------------------------------------------------

function DragOverlayCard({ card, locale, t }: { card: KanbanCardData; locale: string; t: (key: string) => string }) {
  const variant = PRIORITY_VARIANTS[card.priority] || PRIORITY_VARIANTS.medium;
  return (
    <Card className="p-3 space-y-2 shadow-xl ring-2 ring-primary/30 rotate-2">
      <h4 className="text-sm font-medium leading-tight">{card.title}</h4>
      {card.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant={variant as 'secondary' | 'info' | 'warning' | 'destructive'}>
          {t(`priority.${card.priority}`)}
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
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Droppable Column
// ---------------------------------------------------------------------------

function DroppableColumn({
  column,
  children,
}: {
  column: KanbanColumn;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useSortable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
    disabled: true,
  });

  return (
    <div ref={setNodeRef} className="space-y-2 min-h-[100px]">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main KanbanBoard Component
// ---------------------------------------------------------------------------

export function KanbanBoard({ dealId, columns: initialColumns, hasColumns, isReadOnly = false }: Props) {
  const [initState, initAction, initPending] = useActionState<InitState, FormData>(initializeKanban, null);
  const [addCardState, addCardAction, addCardPending] = useActionState<CardState, FormData>(createKanbanCard, null);
  const [isPending, startTransition] = useTransition();
  const [activeAddColumn, setActiveAddColumn] = useState<string | null>(null);
  const [showProofPrompt, setShowProofPrompt] = useState(false);
  const [columns, setColumns] = useState(initialColumns);
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null);
  const t = useTranslations('features.kanban');
  const locale = useLocale();

  // Sync columns from server
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // ---------- DnD sensors ----------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // ---------- Card IDs per column (for SortableContext) ----------
  const columnCardIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of columns) {
      map[col.id] = col.cards.map((c) => c.id);
    }
    return map;
  }, [columns]);

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
        () => { window.location.reload(); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_columns', filter: `deal_id=eq.${dealId}` },
        () => { window.location.reload(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dealId]);

  // ---------- Find which column a card belongs to ----------
  const findColumnByCardId = useCallback((cardId: string): KanbanColumn | undefined => {
    return columns.find((col) => col.cards.some((c) => c.id === cardId));
  }, [columns]);

  // ---------- DnD handlers ----------
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === active.id);
    setActiveCard(card ?? null);
  }, [columns]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnByCardId(activeId);
    // Over could be a card or a column
    const overCol = findColumnByCardId(overId) ??
      columns.find((col) => `column-${col.id}` === overId || col.id === overId);

    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    // Move card between columns optimistically
    setColumns((prev) => {
      const newCols = prev.map((col) => ({ ...col, cards: [...col.cards] }));
      const srcCol = newCols.find((c) => c.id === activeCol.id)!;
      const dstCol = newCols.find((c) => c.id === overCol.id)!;
      const cardIdx = srcCol.cards.findIndex((c) => c.id === activeId);
      if (cardIdx < 0) return prev;

      const [movedCard] = srcCol.cards.splice(cardIdx, 1);
      const overCardIdx = dstCol.cards.findIndex((c) => c.id === overId);
      if (overCardIdx >= 0) {
        dstCol.cards.splice(overCardIdx, 0, movedCard);
      } else {
        dstCol.cards.push(movedCard);
      }
      return newCols;
    });
  }, [columns, findColumnByCardId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnByCardId(activeId);
    if (!activeCol) return;

    // Same column reorder
    if (activeId !== overId) {
      const overCol = findColumnByCardId(overId);
      if (overCol && activeCol.id === overCol.id) {
        const oldIdx = activeCol.cards.findIndex((c) => c.id === activeId);
        const newIdx = activeCol.cards.findIndex((c) => c.id === overId);
        if (oldIdx !== newIdx) {
          setColumns((prev) => {
            return prev.map((col) => {
              if (col.id !== activeCol.id) return col;
              return { ...col, cards: arrayMove(col.cards, oldIdx, newIdx) };
            });
          });
        }
      }
    }

    // Find final column and position
    const finalCol = findColumnByCardId(activeId);
    if (!finalCol) return;
    const finalPos = finalCol.cards.findIndex((c) => c.id === activeId);

    // Server sync
    const fd = new FormData();
    fd.set('card_id', activeId);
    fd.set('target_column_id', finalCol.id);
    fd.set('position', String(finalPos >= 0 ? finalPos : 0));
    fd.set('deal_id', dealId);

    startTransition(() => { moveKanbanCard(null, fd); });

    // Done-column proof prompt
    if (lastColumn && finalCol.id === lastColumn.id) {
      setShowProofPrompt(true);
    }
  }, [dealId, findColumnByCardId, lastColumn]);

  // ---------- Delete ----------
  const handleDeleteCard = useCallback((cardId: string) => {
    const fd = new FormData();
    fd.set('card_id', cardId);
    fd.set('deal_id', dealId);
    startTransition(() => { deleteKanbanCard(null, fd); });
  }, [dealId]);

  // ---------- Initialize board ----------
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
          <p className="text-sm flex-1">{t('proofPrompt')}</p>
          <Link href={`/dashboard/deals/${dealId}/proofs/new`}>
            <Button variant="primary" size="sm">{t('attachProof')}</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setShowProofPrompt(false)}>
            {t('later')}
          </Button>
        </div>
      )}

      {/* Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[800px]">
            {columns.map((col) => (
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
                <SortableContext
                  items={columnCardIds[col.id] || []}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn column={col}>
                    {col.cards.map((card) => (
                      <SortableCard
                        key={card.id}
                        card={card}
                        onDelete={handleDeleteCard}
                        isPending={isPending}
                        locale={locale}
                        t={t}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>

                {/* Add Card */}
                {!isReadOnly && activeAddColumn === col.id ? (
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
                ) : !isReadOnly ? (
                  <button
                    onClick={() => setActiveAddColumn(col.id)}
                    className="mt-2 w-full rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                  >
                    {t('addTask')}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeCard ? (
            <DragOverlayCard card={activeCard} locale={locale} t={t} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
