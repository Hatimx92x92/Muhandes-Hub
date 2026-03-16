'use client';

import { Link } from '@/i18n/navigation';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { FadeIn, FloatingElement } from '@/components/ui/motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { TypingText } from '@/components/ui/typing-text';
import { useTranslations } from 'next-intl';

/* ==========================================================================
   HeroSection — Full-viewport animated hero with parallax + floating shapes
   ========================================================================== */

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const t = useTranslations('home');
  const [heading1Done, setHeading1Done] = useState(false);
  const [heading2Done, setHeading2Done] = useState(false);

  const heading1Text = t('heading1');
  const heading2Text = t('heading2');
  // Compute when the rest of the UI should appear
  const typingDelay1 = 0.3; // initial delay before heading1 starts
  const charSpeed = 0.045;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const stats = [
    { value: 4, suffix: '', label: t('stats.roles') },
    { value: 4, suffix: '', label: t('stats.plans') },
    { value: 15, suffix: '%', label: t('stats.vatInclusive') },
  ];

  // Parallax offsets for floating shapes
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background"
    >
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]" />

      {/* Floating decorative shapes with parallax */}
      {!prefersReduced && (
        <>
          <motion.div
            style={{ y: y1 }}
            className="absolute top-[15%] start-[8%] pointer-events-none"
          >
            <FloatingElement duration={7} delay={0} distance={24}>
              <div className="h-20 w-20 rounded-full bg-primary/[0.06] blur-sm" />
            </FloatingElement>
          </motion.div>

          <motion.div
            style={{ y: y2 }}
            className="absolute top-[25%] end-[12%] pointer-events-none"
          >
            <FloatingElement duration={8} delay={1} distance={18}>
              <div className="h-32 w-32 rounded-3xl bg-secondary/[0.08] blur-sm rotate-12" />
            </FloatingElement>
          </motion.div>

          <motion.div
            style={{ y: y3 }}
            className="absolute bottom-[20%] start-[15%] pointer-events-none"
          >
            <FloatingElement duration={9} delay={2} distance={16}>
              <div className="h-16 w-16 rounded-2xl bg-primary/[0.05] blur-sm -rotate-6" />
            </FloatingElement>
          </motion.div>

          <motion.div
            style={{ y: y1 }}
            className="absolute top-[60%] end-[8%] pointer-events-none"
          >
            <FloatingElement duration={6} delay={0.5} distance={20}>
              <div className="h-14 w-14 rounded-full bg-secondary/[0.06] blur-sm" />
            </FloatingElement>
          </motion.div>
        </>
      )}

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40 w-full">
        <div className="text-center">
          {/* Trust badge — fade down from top */}
          <FadeIn direction="down" delay={0.1} duration={0.5}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t('trustBadge')}
              </span>
            </div>
          </FadeIn>

          {/* Heading line 1 — letter-by-letter typing */}
          <div className="overflow-hidden max-w-4xl mx-auto">
            <TypingText
              as="h1"
              text={heading1Text}
              delay={typingDelay1}
              speed={charSpeed}
              onComplete={() => setHeading1Done(true)}
              cursor={!heading1Done}
              className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl wrap-break-word"
            />
          </div>

          {/* Heading line 2 — types after heading1 finishes */}
          <div className="overflow-hidden max-w-4xl mx-auto mt-3">
            {heading1Done && (
              <TypingText
                as="p"
                text={heading2Text}
                delay={0.1}
                speed={charSpeed}
                onComplete={() => setHeading2Done(true)}
                cursor={!heading2Done}
                className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent wrap-break-word"
              />
            )}
          </div>

          {/* Subheading — appears after typing finishes */}
          {heading2Done && (
            <FadeIn direction="up" delay={0} duration={0.5}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                {t('subheading')}
              </p>
            </FadeIn>
          )}

          {/* CTA buttons — slide up after typing */}
          {heading2Done && (
            <FadeIn direction="up" delay={0.15} duration={0.5}>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group relative inline-flex h-13 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-8 text-base font-bold text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                >
                  {/* Pulse ring on primary CTA */}
                  <span className="absolute inset-0 rounded-xl animate-pulse-ring opacity-0 group-hover:opacity-100" />
                  {t('ctaPrimary')}
                  <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex h-13 items-center rounded-xl border-2 border-border px-8 text-base font-bold text-foreground hover:bg-muted hover:border-primary/30 transition-all duration-200"
                >
                  {t('ctaSecondary')}
                </Link>
              </div>
            </FadeIn>
          )}

          {/* Stats strip — animated counters */}
          {heading2Done && (
            <FadeIn direction="up" delay={0.3} duration={0.5}>
              <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-extrabold text-foreground">
                      <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        duration={1500}
                      />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          )}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
