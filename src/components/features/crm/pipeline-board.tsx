// =============================================================================
// CRM Pipeline Board — Drag-and-Drop Client Component
// =============================================================================

'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
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
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { moveClientPipeline } from '@/actions/crm';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientTag {
  crm_tags: { id: string; name: string; color: string } | null;
}

interface CRMClient {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  is_favorite: boolean;
  last_interaction_at: string | null;
  slug: string | null;
  crm_client_tags: ClientTag[];
}

interface StageConfig {
  key: string;
  color: string;
}

interface PipelineBoardProps {
  clients: CRMClient[];
  stages: StageConfig[];
}

const STAGE_COLORS: Record<string, string> = {
  lead: 'border-t-info',
  in_negotiation: 'border-t-warning',
  active_deal: 'border-t-success',
  completed: 'border-t-primary',
  repeat: 'border-t-accent-purple-foreground',
};

const STAGE_BG: Record<string, string> = {
  lead: 'bg-info/5',
  in_negotiation: 'bg-warning/5',
  active_deal: 'bg-success/5',
  completed: 'bg-primary/5',
  repeat: 'bg-accent-purple/5',
};

// ---------------------------------------------------------------------------
// Sortable Client Card
// ---------------------------------------------------------------------------

function SortableClientCard({
  client,
  locale,
  t,
}: {
  client: CRMClient;
  locale: string;
  t: (key: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Link href={`/dashboard/crm/${client.slug || client.id}`}>
        <Card className="p-3 hover:border-primary transition-colors group">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              onClick={(e) => e.preventDefault()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                {client.is_favorite && <span className="text-warning text-xs">★</span>}
                <h4 className="text-sm font-semibold truncate">{client.name}</h4>
              </div>
              {client.company && (
                <p className="text-xs text-muted-foreground truncate">{client.company}</p>
              )}
              {client.crm_client_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {client.crm_client_tags.map((ct) => {
                    const tag = ct.crm_tags;
                    if (!tag) return null;
                    return (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
              {client.last_interaction_at && (
                <p className={`text-[10px] mt-1 ${(() => {
                  const days = Math.floor((Date.now() - new Date(client.last_interaction_at).getTime()) / 86400000);
                  if (days < 30) return 'text-success';
                  if (days < 90) return 'text-warning';
                  return 'text-destructive';
                })()}`}>
                  {new Date(client.last_interaction_at).toLocaleDateString(locale)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag Overlay Card
// ---------------------------------------------------------------------------

function OverlayCard({ client }: { client: CRMClient }) {
  return (
    <Card className="p-3 shadow-xl ring-2 ring-primary/30 rotate-1 w-[220px]">
      <div className="flex items-center gap-1.5 mb-0.5">
        {client.is_favorite && <span className="text-warning text-xs">★</span>}
        <h4 className="text-sm font-semibold truncate">{client.name}</h4>
      </div>
      {client.company && (
        <p className="text-xs text-muted-foreground">{client.company}</p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Droppable Column
// ---------------------------------------------------------------------------

function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef } = useSortable({
    id: `stage-${stageKey}`,
    data: { type: 'column', stageKey },
    disabled: true,
  });

  return (
    <div ref={setNodeRef} className="space-y-2 min-h-[80px]">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Board (main component)
// ---------------------------------------------------------------------------

export function PipelineBoard({ clients: initialClients, stages }: PipelineBoardProps) {
  const t = useTranslations('dashboard.crm');
  const locale = useLocale();
  const [clients, setClients] = useState(initialClients);
  const [activeClient, setActiveClient] = useState<CRMClient | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Group clients by stage
  const clientsByStage = useMemo(() => {
    const grouped: Record<string, CRMClient[]> = {};
    for (const stage of stages) {
      grouped[stage.key] = clients.filter((c) => c.pipeline_stage === stage.key);
    }
    return grouped;
  }, [clients, stages]);

  // Stage client IDs for SortableContext
  const stageClientIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const stage of stages) {
      map[stage.key] = (clientsByStage[stage.key] || []).map((c) => c.id);
    }
    return map;
  }, [clientsByStage, stages]);

  const findStageByClientId = useCallback((clientId: string): string | undefined => {
    return stages.find((s) =>
      (clientsByStage[s.key] || []).some((c) => c.id === clientId),
    )?.key;
  }, [clientsByStage, stages]);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const client = clients.find((c) => c.id === event.active.id);
    setActiveClient(client ?? null);
  }, [clients]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeStage = findStageByClientId(activeId);
    // Over could be a client card or a stage column
    const overStage = findStageByClientId(overId) ??
      stages.find((s) => `stage-${s.key}` === overId)?.key;

    if (!activeStage || !overStage || activeStage === overStage) return;

    setClients((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, pipeline_stage: overStage } : c,
      ),
    );
  }, [findStageByClientId, stages]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event;
    setActiveClient(null);

    const activeId = active.id as string;
    const client = clients.find((c) => c.id === activeId);
    if (!client) return;

    // Persist to server
    startTransition(() => {
      moveClientPipeline(client.id, client.pipeline_stage);
    });
  }, [clients]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[900px]">
          {stages.map((stage) => {
            const stageClients = clientsByStage[stage.key] || [];
            return (
              <div
                key={stage.key}
                className={cn(
                  'flex-1 min-w-[200px] rounded-xl border border-border border-t-4 p-3',
                  STAGE_COLORS[stage.key],
                  STAGE_BG[stage.key],
                )}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">{t(`stage.${stage.key}`)}</h3>
                  <Badge variant="secondary">{stageClients.length}</Badge>
                </div>

                {/* Client Cards */}
                <SortableContext
                  items={stageClientIds[stage.key] || []}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn stageKey={stage.key}>
                    {stageClients.map((client) => (
                      <SortableClientCard
                        key={client.id}
                        client={client}
                        locale={locale}
                        t={t}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeClient ? <OverlayCard client={activeClient} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
