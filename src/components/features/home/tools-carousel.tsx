'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Check,
  FileSpreadsheet,
  FileText,
  Handshake,
  KanbanSquare,
  Star,
  Upload,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MagicCard } from '@/components/ui/magic-card';
import { Marquee } from '@/components/ui/marquee';
import { cn } from '@/lib/utils';

/* ==========================================================================
   Tools Carousel — Horizontal auto-scrolling showcase of business tools
   Placed inside the hero section between the grid and stats strip
   ========================================================================== */

const toolCard =
  'h-[168px] w-[228px] shrink-0 rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden';

/* --------------------------------------------------------------------------
   1. Deal Workspace — milestone progress bar with colored segments
   -------------------------------------------------------------------------- */

function DealWorkspaceCard() {
  const t = useTranslations('home.tools.dealWorkspace');
  const prefersReduced = useReducedMotion();

  const milestones = [
    { done: true, w: 'w-[25%]', color: 'bg-success' },
    { done: true, w: 'w-[25%]', color: 'bg-success' },
    { done: false, w: 'w-[25%]', color: 'bg-primary', active: true },
    { done: false, w: 'w-[25%]', color: 'bg-muted' },
  ];

  return (
    <MagicCard className={toolCard} gradientColor="hsl(var(--primary) / 0.07)">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Handshake className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground">{t('title')}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{t('desc')}</p>

        {/* Progress bar */}
        <div className="mt-auto space-y-2">
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={prefersReduced ? {} : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.4 }}
                className={cn('origin-start h-full rounded-sm', m.w, m.done ? m.color : m.active ? 'bg-primary/60' : 'bg-muted')}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">4 milestones</span>
            <span className="font-bold text-primary tabular-nums">62%</span>
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   2. CRM Pipeline — 3 tiny kanban columns with colored dots
   -------------------------------------------------------------------------- */

function CRMPipelineCard() {
  const t = useTranslations('home.tools.crmPipeline');
  const prefersReduced = useReducedMotion();

  const cols = [
    { label: 'Lead', count: 3, color: 'bg-warning' },
    { label: 'Active', count: 2, color: 'bg-info' },
    { label: 'Won', count: 4, color: 'bg-success' },
  ];

  return (
    <MagicCard className={toolCard} gradientColor="hsl(var(--info) / 0.07)">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
            <Users className="h-3.5 w-3.5 text-info" />
          </div>
          <p className="text-xs font-bold text-foreground">{t('title')}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{t('desc')}</p>

        {/* Pipeline columns */}
        <div className="mt-auto flex gap-2">
          {cols.map((col, colIdx) => (
            <motion.div
              key={col.label}
              initial={prefersReduced ? {} : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + colIdx * 0.12, duration: 0.3 }}
              className="flex-1 rounded-lg bg-muted/60 px-1.5 py-1.5"
            >
              <p className="text-[9px] font-semibold text-muted-foreground text-center mb-1.5">{col.label}</p>
              <div className="flex flex-col items-center gap-1">
                {Array.from({ length: col.count }).map((_, i) => (
                  <div key={i} className={cn('h-1.5 w-full rounded-sm', col.color, 'opacity-70')} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   3. Bulk Management — CSV upload progress
   -------------------------------------------------------------------------- */

function BulkManagementCard() {
  const t = useTranslations('home.tools.bulkManagement');
  const prefersReduced = useReducedMotion();

  return (
    <MagicCard className={toolCard} gradientColor="hsl(var(--success) / 0.07)">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
            <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
          </div>
          <p className="text-xs font-bold text-foreground">{t('title')}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{t('desc')}</p>

        {/* Upload mockup */}
        <div className="mt-auto space-y-2">
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-2"
          >
            <Upload className="h-3 w-3 text-success shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">products.csv</span>
            <Check className="h-3 w-3 text-success shrink-0 ms-auto" />
          </motion.div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-success font-semibold">142 products</span>
            <span className="text-muted-foreground">imported</span>
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   4. Ratings & Reviews — star row + mini distribution bars
   -------------------------------------------------------------------------- */

function RatingsCard() {
  const t = useTranslations('home.tools.ratings');
  const prefersReduced = useReducedMotion();

  const dist = [
    { stars: 5, pct: 68 },
    { stars: 4, pct: 22 },
    { stars: 3, pct: 7 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 1 },
  ];

  return (
    <MagicCard className={toolCard} gradientColor="hsl(var(--secondary) / 0.07)">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10">
            <Star className="h-3.5 w-3.5 text-secondary" />
          </div>
          <p className="text-xs font-bold text-foreground">{t('title')}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{t('desc')}</p>

        {/* Rating distribution */}
        <div className="mt-auto flex items-end gap-3">
          <div className="text-center">
            <span className="text-lg font-extrabold text-foreground">4.8</span>
            <div className="flex gap-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn('h-2.5 w-2.5', s <= 4 ? 'fill-secondary text-secondary' : 'fill-secondary/40 text-secondary/40')} />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-0.5">
            {dist.map((d, i) => (
              <motion.div
                key={d.stars}
                initial={prefersReduced ? {} : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
                className="flex items-center gap-1 origin-start"
              >
                <span className="text-[8px] text-muted-foreground w-2 text-end">{d.stars}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-secondary/70" style={{ width: `${d.pct}%` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   5. Quotation System — mini document with line items
   -------------------------------------------------------------------------- */

function QuotationCard() {
  const t = useTranslations('home.tools.quotations');
  const prefersReduced = useReducedMotion();

  return (
    <MagicCard className={toolCard} gradientColor="hsl(var(--primary) / 0.07)">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground">{t('title')}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{t('desc')}</p>

        {/* Mini quotation preview */}
        <div className="mt-auto rounded-lg bg-muted/60 p-2 space-y-1.5">
          {[
            { item: 'Steel bars', amt: '45,000' },
            { item: 'Cement bags', amt: '12,500' },
          ].map((line, i) => (
            <motion.div
              key={line.item}
              initial={prefersReduced ? {} : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.25 }}
              className="flex items-center justify-between text-[9px]"
            >
              <span className="text-muted-foreground">{line.item}</span>
              <span className="text-foreground tabular-nums font-medium">SAR {line.amt}</span>
            </motion.div>
          ))}
          <div className="border-t border-border/60 pt-1 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-primary tabular-nums">SAR 57,500</span>
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   6. Kanban Board — 4 tiny columns with task cards
   -------------------------------------------------------------------------- */

function KanbanCard() {
  const t = useTranslations('home.tools.kanban');
  const prefersReduced = useReducedMotion();

  const cols = [
    { label: 'To Do', tasks: 3, color: 'bg-muted-foreground/30' },
    { label: 'In Prog.', tasks: 2, color: 'bg-info/60' },
    { label: 'Review', tasks: 1, color: 'bg-warning/60' },
    { label: 'Done', tasks: 4, color: 'bg-success/60' },
  ];

  return (
    <MagicCard className={toolCard} gradientColor="hsl(var(--primary) / 0.07)">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <KanbanSquare className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground">{t('title')}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{t('desc')}</p>

        {/* Tiny kanban columns */}
        <div className="mt-auto flex gap-1.5">
          {cols.map((col, colIdx) => (
            <motion.div
              key={col.label}
              initial={prefersReduced ? {} : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + colIdx * 0.1, duration: 0.25 }}
              className="flex-1 rounded-md bg-muted/60 px-1 py-1"
            >
              <p className="text-[7px] font-semibold text-muted-foreground text-center mb-1 truncate">{col.label}</p>
              <div className="flex flex-col gap-0.5">
                {Array.from({ length: Math.min(col.tasks, 3) }).map((_, i) => (
                  <div key={i} className={cn('h-1.5 w-full rounded-xs', col.color)} />
                ))}
                {col.tasks > 3 && (
                  <span className="text-[7px] text-muted-foreground text-center">+{col.tasks - 3}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MagicCard>
  );
}

/* ==========================================================================
   ToolsCarousel — Assembled component using Marquee
   ========================================================================== */

export function ToolsCarousel() {
  const t = useTranslations('home.tools');

  const cards = [
    <DealWorkspaceCard key="deal" />,
    <CRMPipelineCard key="crm" />,
    <BulkManagementCard key="bulk" />,
    <RatingsCard key="ratings" />,
    <QuotationCard key="quotations" />,
    <KanbanCard key="kanban" />,
  ];

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
          <BarChart3 className="inline h-3.5 w-3.5 me-1.5 -mt-0.5" />
          {t('label')}
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Scrolling carousel */}
      <div className="relative overflow-hidden rounded-xl">
        <Marquee pauseOnHover className="py-2 [--duration:45s] [--gap:1rem]">
          {cards.map((card, i) => (
            <div key={i} className="shrink-0">
              {card}
            </div>
          ))}
        </Marquee>

        {/* Fade edges */}
        <div className="absolute inset-y-0 inset-s-0 w-16 bg-linear-to-e from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 inset-e-0 w-16 bg-linear-to-s from-background to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );
}
