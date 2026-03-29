'use client';

import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { FadeIn, FloatingElement } from '@/components/ui/motion';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/* ==========================================================================
   CTASection — Final call-to-action with shimmer button + gradient text
   ========================================================================== */

export function CTASection() {
  const prefersReduced = useReducedMotion();
  const t = useTranslations('home.cta');

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-primary via-primary-dark to-primary" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[4rem_4rem]" />

      {/* Floating decorative shapes */}
      {!prefersReduced && (
        <>
          <FloatingElement
            duration={7}
            delay={0}
            distance={16}
            className="absolute top-[20%] inset-s-[10%] pointer-events-none"
          >
            <div className="h-16 w-16 rounded-full bg-white/6" />
          </FloatingElement>
          <FloatingElement
            duration={9}
            delay={1.5}
            distance={12}
            className="absolute bottom-[25%] inset-e-[8%] pointer-events-none"
          >
            <div className="h-20 w-20 rounded-2xl bg-white/4 rotate-12" />
          </FloatingElement>
        </>
      )}

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn direction="up" delay={0}>
          <h2 className="text-3xl font-extrabold sm:text-4xl mb-4">
            <AnimatedGradientText
              colorFrom="#ffffff"
              colorTo="#e0e7ff"
              speed={2}
              className="text-3xl font-extrabold sm:text-4xl"
            >
              {t('title')}
            </AnimatedGradientText>
          </h2>
        </FadeIn>

        <FadeIn direction="up" delay={0.15}>
          <p className="text-lg text-primary-foreground/80 mb-10 leading-relaxed">
            {t('subtitle')}
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={0.3}>
          <Link href="/register">
            <ShimmerButton
              shimmerColor="#1E56A0"
              background="rgba(255, 255, 255, 0.95)"
              borderRadius="12px"
              className="h-13 px-8 text-base font-bold text-primary shadow-lg"
            >
              {t('button')}
              <ArrowLeft className="ms-2 h-4 w-4 rtl:rotate-180" />
            </ShimmerButton>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
