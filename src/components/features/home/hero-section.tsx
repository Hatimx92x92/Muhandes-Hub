'use client';

import { Link } from '@/i18n/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  HardHat,
  ShoppingCart,
  Truck,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FadeIn } from '@/components/ui/motion';
import { TypingText } from '@/components/ui/typing-text';
import { NumberTicker } from '@/components/ui/number-ticker';
import { DotPattern } from '@/components/ui/dot-pattern';
import { Marquee } from '@/components/ui/marquee';
import { BentoGrid, BentoCell } from '@/components/ui/bento-grid';
import {
  BidTableCell,
  TimelineCell,
  RatingCell,
  ChatCell,
  ContractCell,
} from '@/components/features/home/bento-cells';
import { ToolsCarousel } from '@/components/features/home/tools-carousel';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { PublicStats } from '@/actions/analytics';

/* ==========================================================================
   HeroSection — Split layout with bento grid, role-cycling text, live ticker
   Combines: Bento Grid + Role Perspective + Network Pulse + Activity Ticker
   ========================================================================== */

/* --------------------------------------------------------------------------
   Role-cycling subheading — auto-rotates through role-specific value props
   -------------------------------------------------------------------------- */

const ROLE_ICONS = [Building2, HardHat, Truck, ShoppingCart];
const ROLE_COLORS = [
  'text-role-po-foreground',
  'text-role-contractor-foreground',
  'text-role-supplier-foreground',
  'text-role-buyer-foreground',
];

function RoleCycler({ prefix, roles }: { prefix: string; roles: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % roles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [roles.length]);

  const Icon = ROLE_ICONS[activeIndex];

  return (
    <div className="flex items-center gap-2 text-base text-muted-foreground sm:text-lg">
      <span>{prefix}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={activeIndex}
          initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? {} : { opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className={cn('inline-flex items-center gap-1.5 font-semibold', ROLE_COLORS[activeIndex])}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {roles[activeIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Live Activity Ticker — scrolling event feed showing platform activity
   -------------------------------------------------------------------------- */

function ActivityTicker({ events }: { events: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <Marquee pauseOnHover className="py-2 [--duration:50s]">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-2 px-4 text-xs text-muted-foreground whitespace-nowrap">
            <Zap className="h-3 w-3 text-secondary shrink-0" />
            <span>{event}</span>
            <span className="text-border">•</span>
          </div>
        ))}
      </Marquee>
      {/* Fade edges */}
      <div className="absolute inset-y-0 start-0 w-12 bg-linear-to-e from-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 end-0 w-12 bg-linear-to-s from-card/80 to-transparent z-10 pointer-events-none" />
    </div>
  );
}

/* --------------------------------------------------------------------------
   Network Pulse SVG — animated connecting lines between bento cells
   -------------------------------------------------------------------------- */

function NetworkPulse() {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Horizontal connection — top row */}
      <motion.line
        x1="0%" y1="33%" x2="66%" y2="33%"
        stroke="url(#pulse-grad)"
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
      {/* Vertical connection — right column */}
      <motion.line
        x1="83%" y1="0%" x2="83%" y2="100%"
        stroke="url(#pulse-grad)"
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.4, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      />
      {/* Horizontal connection — middle row */}
      <motion.line
        x1="0%" y1="66%" x2="66%" y2="66%"
        stroke="url(#pulse-grad)"
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 3 }}
      />
    </svg>
  );
}

/* ==========================================================================
   Main Hero Component
   ========================================================================== */

interface HeroSectionProps {
  stats: PublicStats;
}

export function HeroSection({ stats: platformStats }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const t = useTranslations('home');
  const [heading1Done, setHeading1Done] = useState(false);
  const [heading2Done, setHeading2Done] = useState(false);

  const heading1Text = t('heading1');
  const heading2Text = t('heading2');
  const typingDelay1 = 0.3;
  const charSpeed = 0.045;

  // Role-cycling data
  const roleCyclePrefix = t('roleCycle.prefix');
  const roleCycleRoles = [0, 1, 2, 3].map((i) =>
    t(`roleCycle.roles.${i}`),
  );

  // Ticker events
  const tickerEvents = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    t(`ticker.events.${i}`),
  );

  const stats = [
    { value: platformStats.partners, suffix: '+', label: t('stats.partners') },
    { value: platformStats.projects, suffix: '+', label: t('stats.projects') },
    { value: platformStats.products, suffix: '+', label: t('stats.products') },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-linear-to-b from-primary/5 via-primary/2 to-background"
    >
      {/* Dot pattern background */}
      <DotPattern
        width={24}
        height={24}
        cr={1.2}
        glow={!prefersReduced}
        className="absolute inset-0 text-primary/20 mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]"
      />

      {/* Main content — split layout */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* ── Left column: Headlines + Role Cycler + CTAs ── */}
          <div className="text-start">

            {/* Heading line 1 — letter-by-letter typing */}
            <div className="overflow-hidden max-w-xl">
              <TypingText
                as="h1"
                text={heading1Text}
                delay={typingDelay1}
                speed={charSpeed}
                onComplete={() => setHeading1Done(true)}
                cursor={!heading1Done}
                className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-5xl xl:text-6xl wrap-break-word"
              />
            </div>

            {/* Heading line 2 — types after heading1 finishes */}
            <div className="overflow-hidden max-w-xl mt-2">
              {heading1Done && (
                <TypingText
                  as="p"
                  text={heading2Text}
                  delay={0.1}
                  speed={charSpeed}
                  onComplete={() => setHeading2Done(true)}
                  cursor={!heading2Done}
                  className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-4xl xl:text-5xl bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent wrap-break-word"
                />
              )}
            </div>

            {/* Role-cycling subheading — replaces static subheading */}
            {heading2Done && (
              <FadeIn direction="up" delay={0} duration={0.5}>
                <div className="mt-5 space-y-2">
                  <p className="max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed">
                    {t('subheading')}
                  </p>
                  <RoleCycler prefix={roleCyclePrefix} roles={roleCycleRoles} />
                </div>
              </FadeIn>
            )}

            {/* CTA buttons */}
            {heading2Done && (
              <FadeIn direction="up" delay={0.15} duration={0.5}>
                <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                  <Link
                    href="/register"
                    className="group relative inline-flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-7 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 rounded-xl animate-pulse-ring opacity-0 group-hover:opacity-100" />
                    {t('ctaPrimary')}
                    <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/projects"
                    className="inline-flex h-12 items-center rounded-xl border-2 border-border px-7 text-sm font-bold text-foreground hover:bg-muted hover:border-primary/30 transition-all duration-200"
                  >
                    {t('ctaSecondary')}
                  </Link>
                </div>
              </FadeIn>
            )}
          </div>

          {/* ── Right column: Bento Grid with Network Pulse ── */}
          <div className="hidden sm:block relative">
            {/* Network pulse lines between cells */}
            <NetworkPulse />

            {/*
              Desktop (3-col) layout:
              ┌──────────────┬────────┐
              │  Bid Table   │ Deal   │
              │  (col-span-2)│Timeline│
              ├───────┬──────┤(row-   │
              │Active │ Chat │span-2) │
              ├───────┼──────┼────────┤
              │Rating │ Contract      │
              └───────┴───────────────┘
            */}
            <BentoGrid delay={0.5} className="relative z-10 max-w-lg lg:max-w-none mx-auto">
              <BentoCell colSpan={2}>
                <BidTableCell />
              </BentoCell>
              <BentoCell rowSpan={2}>
                <TimelineCell />
              </BentoCell>
              <BentoCell colSpan={2}>
                <ChatCell />
              </BentoCell>
              <BentoCell>
                <RatingCell />
              </BentoCell>
              <BentoCell>
                <ContractCell />
              </BentoCell>
            </BentoGrid>
          </div>
        </div>

        {/* ── Business Tools Carousel — scrolling tool showcase ── */}
        {heading2Done && (
          <FadeIn direction="up" delay={0.2} duration={0.5}>
            <div className="mt-12">
              <ToolsCarousel />
            </div>
          </FadeIn>
        )}

        {/* ── Stats strip — full-width below the split ── */}
        {heading2Done && (
          <FadeIn direction="up" delay={0.3} duration={0.5}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-16 border-t border-border/50 pt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-extrabold text-foreground">
                    <NumberTicker value={stat.value} delay={0.3} />
                    {stat.suffix && <span>{stat.suffix}</span>}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        )}

        {/* ── Live Activity Ticker — scrolling platform events ── */}
        {heading2Done && (
          <FadeIn direction="up" delay={0.5} duration={0.5}>
            <div className="mt-6">
              <ActivityTicker events={tickerEvents} />
            </div>
          </FadeIn>
        )}
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-linear-to-t from-background to-transparent" />
    </section>
  );
}
