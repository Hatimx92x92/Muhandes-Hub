'use client';

import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { FadeIn, FloatingElement } from '@/components/ui/motion';
import { useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/* ==========================================================================
   CTASection — Final call-to-action with animated entrance + floating shapes
   ========================================================================== */

export function CTASection() {
  const prefersReduced = useReducedMotion();
  const t = useTranslations('home.cta');

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Floating decorative shapes */}
      {!prefersReduced && (
        <>
          <FloatingElement
            duration={7}
            delay={0}
            distance={16}
            className="absolute top-[20%] start-[10%] pointer-events-none"
          >
            <div className="h-16 w-16 rounded-full bg-white/[0.06]" />
          </FloatingElement>
          <FloatingElement
            duration={9}
            delay={1.5}
            distance={12}
            className="absolute bottom-[25%] end-[8%] pointer-events-none"
          >
            <div className="h-20 w-20 rounded-2xl bg-white/[0.04] rotate-12" />
          </FloatingElement>
        </>
      )}

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn direction="up" delay={0}>
          <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl mb-4">
            {t('title')}
          </h2>
        </FadeIn>

        <FadeIn direction="up" delay={0.15}>
          <p className="text-lg text-primary-foreground/80 mb-10 leading-relaxed">
            {t('subtitle')}
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={0.3}>
          <Link
            href="/register"
            className="group inline-flex h-13 items-center gap-2 rounded-xl bg-white px-8 text-base font-bold text-primary shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
          >
            {t('button')}
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
