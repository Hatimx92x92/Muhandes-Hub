'use client';

import { Link } from '@/i18n/navigation';
import { useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import { FadeIn } from '@/components/ui/motion';
import { TypingText } from '@/components/ui/typing-text';
import { NumberTicker } from '@/components/ui/number-ticker';
import { DotPattern } from '@/components/ui/dot-pattern';
import { useTranslations } from 'next-intl';

/* ==========================================================================
   HeroSection — Full-viewport animated hero with dot pattern background
   ========================================================================== */

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const t = useTranslations('home');
  const [heading1Done, setHeading1Done] = useState(false);
  const [heading2Done, setHeading2Done] = useState(false);

  const heading1Text = t('heading1');
  const heading2Text = t('heading2');
  const typingDelay1 = 0.3;
  const charSpeed = 0.045;

  const stats = [
    { value: 4, suffix: '', label: t('stats.roles') },
    { value: 4, suffix: '', label: t('stats.plans') },
    { value: 15, suffix: '%', label: t('stats.vatInclusive') },
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

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40 w-full">
        <div className="text-center">
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
                  className="group relative inline-flex h-13 items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark px-8 text-base font-bold text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                >
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

          {/* Stats strip — Magic UI number tickers */}
          {heading2Done && (
            <FadeIn direction="up" delay={0.3} duration={0.5}>
              <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
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
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-linear-to-t from-background to-transparent" />
    </section>
  );
}
