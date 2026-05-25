'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Circle,
  MessageSquare,
  Rocket,
  Star,
  TrendingUp,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MagicCard } from '@/components/ui/magic-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

/* ==========================================================================
   Bento Cell Components — Decorative mini-UI mockups for hero section
   No real data — purely illustrative dashboard previews
   ========================================================================== */

const cellCard =
  'h-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden';

/* --------------------------------------------------------------------------
   Cell 1 — Bid Comparison Table (col-span-2)
   -------------------------------------------------------------------------- */

export function BidTableCell() {
  const t = useTranslations('home.bento.bidTable');
  const prefersReduced = useReducedMotion();

  const bids = [
    { name: t('bidder1'), amount: '٤٥٠,٠٠٠', rating: 4.8, awarded: true },
    { name: t('bidder2'), amount: '٥٢٠,٠٠٠', rating: 4.5, awarded: false },
    { name: t('bidder3'), amount: '٤٨٠,٠٠٠', rating: 4.2, awarded: false },
  ];

  return (
    <MagicCard
      className={cellCard}
      gradientColor="hsl(var(--primary) / 0.07)"
    >
      <div className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('title')}
        </p>
        <div className="space-y-2">
          {bids.map((bid, i) => (
            <motion.div
              key={bid.name}
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.35 }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                bid.awarded
                  ? 'bg-success/10 ring-1 ring-success/30'
                  : 'bg-muted/50',
              )}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground truncate flex-1 text-start">
                {bid.name}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                SAR {bid.amount}
              </span>
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-secondary text-secondary" />
                <span className="text-xs tabular-nums">{bid.rating}</span>
              </div>
              {bid.awarded && (
                <motion.span
                  initial={prefersReduced ? {} : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 1.4,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="shrink-0 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-success-foreground"
                >
                  {t('award')}
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   Cell 2 — Deal Milestone Timeline (row-span-2)
   -------------------------------------------------------------------------- */

export function TimelineCell() {
  const t = useTranslations('home.bento.timeline');
  const prefersReduced = useReducedMotion();

  const steps: Array<{ key: string; done: boolean; active?: boolean }> = [
    { key: 'foundation', done: true },
    { key: 'structure', done: true },
    { key: 'mep', done: false, active: true },
    { key: 'finishing', done: false },
    { key: 'handover', done: false },
  ];

  return (
    <MagicCard
      className={cellCard}
      gradientColor="hsl(var(--primary) / 0.07)"
    >
      <div className="p-4 h-full flex flex-col">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {t('title')}
        </p>
        <div className="flex-1 flex flex-col justify-between">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={prefersReduced ? {} : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.12, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Node */}
              <div className="relative flex flex-col items-center">
                {step.done ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success">
                    <Check className="h-3 w-3 text-success-foreground" />
                  </div>
                ) : step.active ? (
                  <div className="relative flex h-5 w-5 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                    <Circle className="h-4 w-4 fill-primary text-primary" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-border" />
                )}
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-5 w-0.5 h-4',
                      step.done ? 'bg-success/50' : 'bg-border',
                    )}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium',
                  step.done
                    ? 'text-foreground'
                    : step.active
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground',
                )}
              >
                {t(step.key)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   Cell 3 — Live Activity Counter (1×1)
   -------------------------------------------------------------------------- */

export function ActivityCell({ count }: { count: number }) {
  const t = useTranslations('home.bento.activity');

  return (
    <MagicCard
      className={cellCard}
      gradientColor="hsl(var(--primary) / 0.07)"
    >
      <div className="p-4 h-full flex flex-col justify-center items-center text-center">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-foreground tabular-nums">
            <NumberTicker value={count} delay={0.8} />
          </span>
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          {t('label')}
        </p>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   Cell 4 — Rating Badge (1×1)
   -------------------------------------------------------------------------- */

export function RatingCell() {
  const t = useTranslations('home.bento.rating');
  const prefersReduced = useReducedMotion();

  return (
    <MagicCard
      className={cellCard}
      gradientColor="hsl(var(--secondary) / 0.07)"
    >
      <div className="p-4 h-full flex flex-col justify-center items-center text-center gap-1.5">
        <span className="text-2xl font-extrabold text-foreground">4.8</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              initial={prefersReduced ? {} : { opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1 + star * 0.1,
                type: 'spring',
                stiffness: 400,
                damping: 15,
              }}
            >
              <Star
                className={cn(
                  'h-3.5 w-3.5',
                  star <= 4
                    ? 'fill-secondary text-secondary'
                    : 'fill-secondary/40 text-secondary/40',
                )}
              />
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          128 {t('reviews')}
        </p>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   Cell 5 — Chat Preview (1×1)
   -------------------------------------------------------------------------- */

export function ChatCell() {
  const t = useTranslations('home.bento.chat');
  const prefersReduced = useReducedMotion();

  return (
    <MagicCard
      className={cellCard}
      gradientColor="hsl(var(--info) / 0.07)"
    >
      <div className="p-4 h-full flex flex-col justify-end gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <MessageSquare className="inline h-3 w-3 me-1" />
          {t('title')}
        </p>
        {/* Received bubble */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="self-start max-w-[80%] rounded-xl rounded-es-sm bg-muted px-3 py-1.5"
        >
          <p className="text-xs text-foreground">{t('message1')}</p>
        </motion.div>
        {/* Sent bubble */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.3 }}
          className="self-end max-w-[80%] rounded-xl rounded-ee-sm bg-primary px-3 py-1.5"
        >
          <p className="text-xs text-primary-foreground">{t('message2')}</p>
        </motion.div>
        {/* Typing indicator */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.3 }}
          className="self-start flex items-center gap-1 rounded-xl bg-muted px-3 py-2"
        >
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
        </motion.div>
      </div>
    </MagicCard>
  );
}

/* --------------------------------------------------------------------------
   Cell 6 — Join CTA (1×1)
   -------------------------------------------------------------------------- */

export function ContractCell() {
  const t = useTranslations('home.bento.cta');
  const prefersReduced = useReducedMotion();

  return (
    <MagicCard
      className={cellCard}
      gradientColor="hsl(var(--primary) / 0.12)"
    >
      <div className="p-4 h-full flex flex-col items-center justify-center text-center gap-2">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
        >
          <Rocket className="h-5 w-5 text-primary" />
        </motion.div>
        <motion.p
          initial={prefersReduced ? {} : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="text-[11px] font-semibold text-foreground leading-tight"
        >
          {t('heading')}
        </motion.p>
        <motion.div
          initial={prefersReduced ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 1.1,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 cursor-pointer hover:bg-primary/90 transition-colors"
        >
          <span className="text-[10px] font-bold text-primary-foreground">
            {t('button')}
          </span>
          <ArrowRight className="h-3 w-3 text-primary-foreground" />
        </motion.div>
      </div>
    </MagicCard>
  );
}
